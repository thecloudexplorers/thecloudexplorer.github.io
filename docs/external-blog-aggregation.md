# External Blog Post Aggregation

This system automatically aggregates blog posts from external sources and displays them alongside internal posts on The Cloud Explorers website.

## Features

- 🌐 **Multi-source aggregation**: Pulls posts from devjev.nl, bearman.nl, and wesleycamargo.github.io
- 🎨 **Visual distinction**: External posts have a distinct blue border and blog name badge
- 🔗 **External linking**: All external posts link directly to the original source
- ⚡ **Automatic updates**: Daily automated refresh via GitHub Actions
- 📱 **Responsive design**: Works seamlessly with the existing Toha theme

## How it Works

### 1. Data Structure

External posts are stored in `data/external_posts.yaml` with the following structure:

```yaml
posts:
  - title: "Post Title"
    url: "https://original-blog.com/post-url/"
    blog_name: "Blog Name"
    blog_url: "https://original-blog.com/"
    date: "2025-07-05T14:30:00Z"
    summary: "Post description or excerpt"
    image: "https://original-blog.com/image.jpg"
    tags: ["tag1", "tag2"]
    external: true
```

### 2. Template Integration

- **Homepage**: The `layouts/partials/sections/recent-posts.html` template merges internal and external posts by date
- **Visual Design**: External posts use `layouts/partials/cards/external-post.html` template with distinct styling
- **CSS Styling**: `assets/styles/components/external-posts.scss` provides visual distinction

### 3. Automation

- **Script**: `scripts/aggregate-external-posts.sh` handles the scraping and data generation
- **GitHub Action**: `.github/workflows/update-external-posts.yml` runs daily at 6 AM UTC
- **Manual Trigger**: Can be manually triggered from the GitHub Actions tab

## Configuration

Blog sources are configured in `data/external_blogs.yaml`:

```yaml
blogs:
  - name: "DevJev"
    url: "https://www.devjev.nl/"
    enabled: true
    description: "DevJev's technical blog"
```

## Visual Features

External posts are distinguished by:
- **Blue accent border** on the left side of the card
- **Blog name badge** in the top-right corner
- **External link icons** in the footer
- **Direct linking** to original blog posts (opens in new tab)

## Customization

### Adding New Blogs

1. Add the blog configuration to `data/external_blogs.yaml`
2. Update the scraping script `scripts/aggregate-external-posts.sh`
3. Add a new case in the `scrape_blog()` function

### Styling Changes

Modify `assets/styles/components/external-posts.scss` to customize:
- Border colors
- Badge styling
- Hover effects
- Dark theme adjustments

### Content Limits

Adjust the number of external posts shown by modifying:
- Homepage: Change `first 3` in `recent-posts.html` template
- Scripts: Update `max_posts_per_blog` in the configuration

## Deployment

The system works automatically once deployed:

1. **Build Time**: External posts are included during Hugo site generation
2. **Runtime**: No external API calls - all data is pre-aggregated
3. **Updates**: GitHub Actions handles automatic updates daily

## Future Enhancements

- [ ] RSS feed support (currently not used per requirements)
- [ ] Real-time web scraping with headless browser
- [ ] Duplicate detection across blogs
- [ ] Content filtering and categorization
- [ ] Analytics tracking for external post clicks

## Troubleshooting

### No External Posts Showing

1. Check `data/external_posts.yaml` exists and has valid YAML
2. Verify the date format is ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)
3. Ensure the Hugo site rebuilds after data changes

### GitHub Action Failures

1. Check the action logs in the GitHub repository
2. Verify the script has execute permissions
3. Ensure the repository has write permissions for the action

### Styling Issues

1. Check browser developer tools for CSS conflicts
2. Verify the SCSS is being compiled correctly
3. Test both light and dark theme modes