const express = require('express');
const http = require('http');
const fs = require('fs');
const app = express();
const axios = require('axios');
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'success.html');
const filelath = path.join(__dirname, 'public', 'index.html');


app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(filelath);
});

app.get('/redir',(req,res)=>{
  res.sendFile(filePath);
})
app.get('/search', (req, res) => {
    const { query } = req.query;
    const redirectUrl = `https://redditcrawler.vercel.app/reddit?query=${encodeURIComponent(query)}`;
    res.redirect(redirectUrl);
  });
  


app.get('/reddit', async (req, res) => {
  const { query } = req.query;
  try {
    const posts = await searchReddit(query);
    console.log(posts);
    
  const sliced = posts.slice(0, 20);
  const replacements = [];
  
  for (let i = 0; i < sliced.length; i++) {
    const item = sliced[i];
    const { title, subreddit,content ,comments, upvotes,url } = item;
  
    const replacedItem = `
      <div class="class1">
      <h3>Title</h3>
        <p class="ptitle">${title}</p>
        <h3>Subreddit</h3>
        <p class="pnumber"> ${subreddit}</p>
        <h3>Link Url</h3>
        <p><a href="${url}" target="_blank">${url}</a></p>
        <h3>Main Content</h3>
        <p class="body">${content}</p>
        <h3>Number of Comments</h3>
        <p class="comments">${comments}</p>
        <h3>Upvotes Number</h3>
        <p>${upvotes}</p>
      </div>
    `;
  
    replacements.push(replacedItem);
  }
  
  const replacedData = replacements.join('\n');
  
  const data = fs.readFileSync(filePath, 'utf8');
  const finalData = data.replace('{{main-content}}', replacedData);
  res.send(finalData);
    
 
  } catch (error) {
    console.error('Error searching Reddit:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const searchReddit = async (query) => {
  try {
    const response = await axios.get(`https://www.reddit.com/search.json`, {
      params: { q: query, limit: 30 }
    });
    const posts = response.data.data.children.map(child => child.data);
    return posts.map(post => ({
      subreddit: post.subreddit,
      title: post.title,
      content: post.selftext,
      comments: post.num_comments,
      upvotes: post.ups,
      url: `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}`
    }));
  } catch (error) {
    console.error('Error searching Reddit:', error);
    throw error;
  }
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
