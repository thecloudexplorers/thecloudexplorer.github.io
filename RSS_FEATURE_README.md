# RSS Feed Aggregation Feature

This feature aggregates external blog posts from RSS feeds and displays them on the homepage Recent Posts section, integrated seamlessly with local blog posts.

## Features

- **Homepage Integration**: External posts appear in the Recent Posts section alongside local posts
- **Visual Distinction**: External posts have distinct styling with source badges and external link indicators  
- **Responsive Design**: Works on all device sizes with dark mode support
- **Automatic Updates**: Posts are fetched at build time (development uses mock data)
- **Deduplication**: Prevents duplicate posts from appearing
- **Graceful Fallback**: Falls back to mock data when RSS feeds are unavailable

## Configuration

### External Blog Configuration (`data/external-blogs.yaml`)

```yaml
feeds:
  - name: "DevJev.nl"
    url: "https://www.devjev.nl/"
    rss_url: "https://www.devjev.nl/feed.xml"
    author: "DevJev"
    
  - name: "Bearman.nl"
    url: "https://bearman.nl/"
    rss_url: "https://bearman.nl/feed.xml"
    author: "Bearman"
    
  - name: "Wesley Camargo"
    url: "https://wesleycamargo.github.io/"
    rss_url: "https://wesleycamargo.github.io/feed.xml"
    author: "Wesley Camargo"

config:
  max_posts_per_feed: 5
  enable_aggregation: true
```

### Recent Posts Section (`data/en/sections/posts.yaml`)

```yaml
section:
  name: Recent Posts
  id: recent-posts
  enable: true
  weight: 6
  numShow: 6  # Number of posts to show (combines local + external)
```

## Technical Implementation

### Components

1. **RSS Aggregator** (`themes/toha/layouts/partials/helpers/rss-aggregator.html`)
   - Fetches RSS feeds using Hugo's `resources.GetRemote`
   - Supports both RSS 2.0 and Atom formats
   - Extracts post metadata (title, description, date, images)
   - Falls back to mock data in development

2. **External Post Card** (`themes/toha/layouts/partials/cards/external-post.html`)
   - Custom template for displaying external posts
   - Includes source badges and external link indicators
   - Opens links in new tabs

3. **Recent Posts Section** (`themes/toha/layouts/partials/sections/recent-posts.html`)
   - Modified to fetch and merge external posts with local posts
   - Sorts all posts by date (newest first)
   - Displays mixed content seamlessly

4. **Styling** (`themes/toha/assets/styles/sections/external-posts.scss`)
   - Custom styling for external posts
   - Blue borders and gradient backgrounds
   - Dark mode compatibility
   - Responsive design

### Data Flow

1. **Build Time**: RSS aggregator fetches external feeds
2. **Data Processing**: Posts are parsed and standardized
3. **Merging**: External and local posts are combined and sorted by date
4. **Display**: Recent Posts section renders mixed content with appropriate templates

## Usage

### Adding New RSS Feeds

1. Edit `data/external-blogs.yaml`
2. Add new feed configuration with name, URL, RSS URL, and author
3. The posts will automatically appear on next build

### Customizing Display

- Modify `numShow` in `data/en/sections/posts.yaml` to change number of posts
- Edit styling in `themes/toha/assets/styles/sections/external-posts.scss`
- Customize external post template in `themes/toha/layouts/partials/cards/external-post.html`

## Development

For development, the system uses mock data from `data/mock-external-posts.yaml` to ensure consistent behavior when RSS feeds are not accessible.

## Production Deployment

In production, set the Hugo environment to "production" to enable live RSS feed fetching:

```bash
hugo --environment production
```

## Error Handling

- RSS feed failures are logged but don't break the build
- Graceful fallback to mock data ensures site remains functional
- Missing images are handled with placeholder icons
- Invalid RSS data is skipped silently

## Performance

- RSS feeds are fetched once per build (not on every page load)
- Data is cached by Hugo's resource system
- Only essential post metadata is extracted and stored
- Image extraction is optimized with regex parsing