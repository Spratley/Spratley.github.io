// Short for Blog Logic
// Gather and display all posts on the main blog home page

const postsContainer = document.getElementById("posts-container");
let allPosts = [];

function DisplayPosts(posts) 
{
    postsContainer.innerHTML = '';
    if (posts.length == 0) 
    {
        postsContainer.innerHTML = '<p>No posts found.</p>';
        return;
    }

    // Filter posts to match GET parameter "tag" if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const tagFilter = urlParams.get('tag');
    if (tagFilter)
    {
        posts = posts.filter(post => post.tags && post.tags.includes(tagFilter));

        // Update header to reflect tag
        const blogHeader = document.getElementById("blog-header");
        if (blogHeader)
        {
            blogHeader.innerHTML += " (with tag <span class=\"tags\"><code>" + tagFilter + "</code></span>)<h3 style=\"font-size: 1.25rem;\"><a href=\"index.html\">Clear Tags</a></h3>";
        }
    }

    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.classList.add('post-card');
        postCard.innerHTML = `
            <a href="Posts/${post.fileName}">
                <img src="${post.image}" alt="${post.title}">
                <h3>${post.title}</h3>
            </a>
            `;
        postsContainer.appendChild(postCard);
    });
}

async function LoadPosts() 
{
  try 
  {
    const response = await fetch('posts.json');
    const postsData = await response.json();
    allPosts = postsData || [];
    DisplayPosts(allPosts);
  } 
  catch (error) 
  {
    console.error('Error loading posts:', error);
  }
}
window.addEventListener('DOMContentLoaded', LoadPosts);