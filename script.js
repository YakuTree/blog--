
const supabaseUrl = 'https://ntewqnddtslaglnzdnel.supabase.co'; // Replace with your project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZXdxbmRkdHNsYWdsbnpkbmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgwODcxNTQsImV4cCI6MjA0MzY2MzE1NH0.vaFIl2CT7ayM5Rtd-h8u8B5cS9S4TcUu7CzKvVcnPGg'; // Replace with your anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); // Renamed to avoid conflicts


function togglem() {
    
    const menu = document.querySelector(".menu-links")
    const icon = document.querySelector(".hambur-icon")
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}


document.addEventListener('DOMContentLoaded', function () {
    const articleForm = document.getElementById('articleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            try {
                console.log("Form submission started...");

                const author = "Kaiqi Li";
                const date = document.getElementById('date').value;
                const title = document.getElementById('title').value;
                const description = document.getElementById('description').value;
                const category = document.getElementById('category').value;
                const information = document.getElementById('information').value;
                const image = document.getElementById('image').files[0];
                const pdf = document.getElementById('pdf').files[0];

                let imageURL = '';
                let pdfURL = '';

                // Upload image to Supabase Storage
                if (image) {
                    console.log("Uploading image to Supabase Storage...");
                    const { data: imageData, error: imageError } = await supabase
                        .storage
                        .from('article-images')
                        .upload(`images-${Date.now()}`, image);

                    if (imageError) {
                        console.error("Error uploading image:", imageError.message, imageError);
                        throw new Error("Image upload failed");
                    }

                    // Get the public URL of the uploaded image
                    const { data: imageURLData, error: publicURLError } = supabase
                        .storage
                        .from('article-images')
                        .getPublicUrl(imageData.path);

                    if (publicURLError) {
                        console.error("Error getting image URL:", publicURLError.message, publicURLError);
                        throw new Error("Failed to retrieve image URL");
                    }

                    imageURL = imageURLData.publicUrl;
                    console.log("Image uploaded successfully. Image URL:", imageURL);
                }

                // Upload PDF to Supabase Storage
                if (pdf) {
                    console.log("Uploading PDF to Supabase Storage...");
                    const { data: pdfData, error: pdfError } = await supabase
                        .storage
                        .from('article-pdfs')
                        .upload(`pdfs-${Date.now()}.pdf`, pdf);

                    if (pdfError) {
                        console.error("Error uploading PDF:", pdfError.message, pdfError);
                        throw new Error("PDF upload failed");
                    }

                    // Get the public URL of the uploaded PDF
                    const { data: pdfURLData, error: pdfPublicURLError } = supabase
                        .storage
                        .from('article-pdfs')
                        .getPublicUrl(pdfData.path);

                    if (pdfPublicURLError) {
                        console.error("Error getting PDF URL:", pdfPublicURLError.message, pdfPublicURLError);
                        throw new Error("Failed to retrieve PDF URL");
                    }

                    pdfURL = pdfURLData.publicUrl;
                    console.log("PDF uploaded successfully. PDF URL:", pdfURL);
                }

                saveArticle(author, date, title, description, category, imageURL, pdfURL, information);
            } catch (error) {
                console.error("An error occurred:", error);
            }
        });
    }

    async function saveArticle(author, date, title, description, category, imageURL, pdfURL, information) {
        console.log("Saving article metadata to Supabase...");

        const { data, error } = await supabase
            .from('articles')
            .insert([
                {
                    author,
                    date,
                    title,
                    description,
                    category,
                    imageURL,
                    pdfURL,
                    information,
                }
            ]);

        if (error) {
            console.error("Error saving article:", error.message, error);
            return;
        }

        console.log("Article saved successfully. Redirecting to category page...");
        window.location.href = `${category}.html`;
    }

    // Function to render articles from Supabase
    async function renderArticles() {
        const articlesContainer = document.getElementById('articles');
        if (articlesContainer) {
            // Get the current page name to determine the category
            const pageCategory = window.location.pathname.split('/').pop().split('.')[0];
            console.log("Loading articles for category:", pageCategory);
    
            // Fetch articles from Supabase for the specific category
            const { data: articles, error } = await supabase
                .from('articles')
                .select('*')
                .eq('category', pageCategory);
    
            if (error) {
                console.error("Error retrieving articles:", error.message);
                return;
            }
    
            console.log("Retrieved articles:", articles);
    
            if (!articles || articles.length === 0) {
                console.log("No articles found for this category.");
                return;
            }
    
            articlesContainer.innerHTML = ''; // Clear the container first
            articles.forEach((article) => {
                const articleElement = document.createElement('article');
                articleElement.classList.add('article');
    
                articleElement.innerHTML = `
                <a href="${article.pdfURL}" target="_blank" rel="noopener noreferrer" class="article-link">
                        <img src="${article.imageURL || 'default.jpg'}" alt="Article Image" class="article-image">
                        <div class="article-info">
                            <h2 class="article-title">${article.title}</h2>
                            <p class="article-description">${article.description}</p>
                            <p>${article.author} @ ${new Date(article.date).toDateString()}</p>
                        </div>
                    </a>
                    <button class="delete-button" onclick="deleteArticle(${article.id}, '${pageCategory}')">Delete Article</button>
                `;
    
                articlesContainer.prepend(articleElement);
            });
        }
    }
    
    document.addEventListener('DOMContentLoaded', function () {
        renderArticles(); // Ensure this function is called to render the articles on page load
    });
    
    // Function to delete an article from Supabase
    // Function to delete an article from Supabase
    window.deleteArticle = async function (id, category) {
        // Check if the user is authenticated before proceeding
        const session = await supabase.auth.getSession();
    
        if (!session.data.session) {
            alert("You need to be logged in to delete an article.");
            window.location.href = 'login.html'; // Redirect to login page if user is not logged in
            return;
        }
    
            // Step 3: Retrieve the article from Supabase to get the imageURL and pdfURL
            const { data: article, error: retrieveError } = await supabase
                .from('articles')
                .select('imageURL, pdfURL')
                .eq('id', id)
                .single(); // We expect a single result
    
            if (retrieveError) {
                console.error("Error retrieving article:", retrieveError.message);
                return;
            }
    
            const { imageURL, pdfURL } = article;
    
            // Step 4: Delete the image from Supabase Storage (if it exists)
            if (imageURL) {
                const imagePath = imageURL.split('/').pop(); // Get the image path from the URL
                const { error: imageDeleteError } = await supabase
                    .storage
                    .from('article-images')
                    .remove([imagePath]);
    
                if (imageDeleteError) {
                    console.error("Error deleting image from Supabase:", imageDeleteError.message);
                } else {
                    console.log("Image deleted successfully.");
                }
            }
    
            // Step 5: Delete the PDF from Supabase Storage (if it exists)
            if (pdfURL) {
                const pdfPath = pdfURL.split('/').pop(); // Get the PDF path from the URL
                const { error: pdfDeleteError } = await supabase
                    .storage
                    .from('article-pdfs')
                    .remove([pdfPath]);
    
                if (pdfDeleteError) {
                    console.error("Error deleting PDF from Supabase:", pdfDeleteError.message);
                } else {
                    console.log("PDF deleted successfully.");
                }
            }
    
            // Step 6: Delete the article record from the Supabase database
            const { error: deleteError } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);
    
            if (deleteError) {
                console.error("Error deleting article:", deleteError.message);
                return;
            }
    
            console.log("Article deleted successfully. Refreshing the page...");
            // Reload the page to refresh the list of articles
            window.location.reload();
        
    };
    


    // Call renderArticles to display articles on page load
    renderArticles();
});




