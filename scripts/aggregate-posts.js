#!/usr/bin/env node

/**
 * External Blog Post Aggregator
 * 
 * Fetches blog posts from external GitHub repositories using GitHub API
 * (without RSS feeds) and stores them in Hugo data files.
 * 
 * Target repositories:
 * - devjev/devjev.nl (or similar)
 * - bearman-nl (or similar structure)
 * - wesleycamargo/wesleycamargo.github.io
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const yaml = require('js-yaml');

// Configuration for target repositories
const TARGET_REPOS = [
  {
    owner: 'wesleycamargo',
    repo: 'wesleycamargo.github.io',
    postPath: 'content/posts',  // Typical Hugo structure
    branch: 'main'
  },
  // Add other repositories as needed
  // Note: We'll need to discover the exact repo names and structures
];

/**
 * Make GitHub API request
 */
function makeGitHubRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'thecloudexplorers-blog-aggregator',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    // Add GitHub token if available
    if (process.env.GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get files from repository directory
 */
async function getRepoFiles(owner, repo, path, branch = 'main') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  console.log(`Fetching files from: ${url}`);
  
  try {
    return await makeGitHubRequest(url);
  } catch (error) {
    console.warn(`Failed to fetch files from ${owner}/${repo}/${path}: ${error.message}`);
    return [];
  }
}

/**
 * Get file content from repository
 */
async function getFileContent(owner, repo, path, branch = 'main') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  try {
    const response = await makeGitHubRequest(url);
    if (response.content && response.encoding === 'base64') {
      return Buffer.from(response.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch file content from ${owner}/${repo}/${path}: ${error.message}`);
    return null;
  }
}

/**
 * Parse Hugo front matter from markdown content
 */
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return null;
  }
  
  try {
    const frontMatter = yaml.load(match[1]);
    const body = match[2];
    return { frontMatter, body };
  } catch (error) {
    console.warn(`Failed to parse front matter: ${error.message}`);
    return null;
  }
}

/**
 * Extract summary from content
 */
function extractSummary(content, maxLength = 200) {
  // Remove markdown formatting and get plain text
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last complete sentence within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1);
  }
  
  return truncated + '...';
}

/**
 * Process posts from a single repository
 */
async function processRepository(repoConfig) {
  console.log(`Processing repository: ${repoConfig.owner}/${repoConfig.repo}`);
  
  const files = await getRepoFiles(repoConfig.owner, repoConfig.repo, repoConfig.postPath, repoConfig.branch);
  const posts = [];
  
  for (const file of files) {
    if (file.type === 'file' && file.name.endsWith('.md') && !file.name.startsWith('_')) {
      console.log(`Processing post: ${file.name}`);
      
      const content = await getFileContent(repoConfig.owner, repoConfig.repo, file.path, repoConfig.branch);
      if (!content) continue;
      
      const parsed = parseFrontMatter(content);
      if (!parsed || !parsed.frontMatter) continue;
      
      const { frontMatter, body } = parsed;
      
      // Create external post object
      const post = {
        title: frontMatter.title || file.name.replace('.md', ''),
        date: frontMatter.date || frontMatter.publishDate || new Date().toISOString(),
        summary: frontMatter.summary || frontMatter.description || extractSummary(body),
        url: `https://${repoConfig.owner}.github.io/${file.name.replace('.md', '')}`,
        source: {
          repository: `${repoConfig.owner}/${repoConfig.repo}`,
          author: repoConfig.owner,
          originalUrl: `https://github.com/${repoConfig.owner}/${repoConfig.repo}/blob/${repoConfig.branch}/${file.path}`
        },
        tags: frontMatter.tags || [],
        external: true
      };
      
      posts.push(post);
    }
  }
  
  console.log(`Found ${posts.length} posts in ${repoConfig.owner}/${repoConfig.repo}`);
  return posts;
}

/**
 * Remove duplicate posts based on title and date
 */
function deduplicatePosts(posts) {
  const seen = new Set();
  return posts.filter(post => {
    const key = `${post.title.toLowerCase()}-${post.date}`;
    if (seen.has(key)) {
      console.log(`Removing duplicate post: ${post.title}`);
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Main aggregation function
 */
async function aggregatePosts() {
  console.log('Starting external blog post aggregation...');
  
  let allPosts = [];
  
  for (const repoConfig of TARGET_REPOS) {
    try {
      const posts = await processRepository(repoConfig);
      allPosts = allPosts.concat(posts);
    } catch (error) {
      console.error(`Error processing repository ${repoConfig.owner}/${repoConfig.repo}:`, error.message);
    }
  }
  
  // Deduplicate and sort by date
  allPosts = deduplicatePosts(allPosts);
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  console.log(`Total external posts found: ${allPosts.length}`);
  
  // Save to Hugo data file
  const dataPath = path.join(__dirname, '..', 'data', 'en', 'external-posts.yaml');
  const yamlContent = yaml.dump({ posts: allPosts }, { 
    defaultFlowStyle: false,
    lineWidth: -1 
  });
  
  await fs.writeFile(dataPath, yamlContent, 'utf-8');
  console.log(`External posts saved to: ${dataPath}`);
  
  return allPosts;
}

// Run if called directly
if (require.main === module) {
  aggregatePosts()
    .then(posts => {
      console.log(`✅ Successfully aggregated ${posts.length} external posts`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Aggregation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { aggregatePosts };