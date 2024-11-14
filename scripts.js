function initializeComments(config) {
    const { domain, url, containerId, limit } = config; // Set default limit to 5
    const container = document.getElementById(containerId);
    container.innerHTML = `
    <div class="comments-container" id="commentsContainer", style =  "position: relative;">
        <div class="box-comment mb16">
            <div class="header-comment flex-comment">
                <div class="title-comment">Comment</div>
            </div>
            <!-- Sorting Filter -->
            <div class="sort-comments">
                <label for="sortSelect"></label>
                <select id="sortSelect">
                    <option value="date">Newest</option>
                    <option value="likes">Popular</option>
                </select>
            </div>
            <div id="comments_area">
                <div class="comment_loading"></div>
                <div class="main-comment scrollbar-inner" id="list_comment"></div>
            </div>
            <!-- Load More Button -->
            <button id="viewMoreButton" style="display: none; background-color : blue ; height : 40px ; width : auto ; border-radius : 20px; color : white; margin-bottom : 20px">Load more comments</button>
            <div class="make-comment">
                <form id="comment_form" class="form-group" autocomplete="off" novalidate="novalidate">
                    <div class="form-default box-area-input">
                        <textarea class="form-control" id="comment_content" name="comment_content" placeholder="Add comment"></textarea>
                        <div class="send-comment">
                            <button type="submit" class="send" id="btn_submit">
                                <svg class="icon-svg"><use xlink:href="icon.svg#Send"></use></svg>
                            </button>
                        </div>
                    </div>
                    <div class="form-default">
                        <div class="form-group">
                            <input type="text" id="comment_author" name="comment_author" class="form-control" placeholder="Name">
                        </div>
                        <div class="form-group">
                            <input type="email" id="comment_email" class="form-control" autocomplete="off" name="comment_email" placeholder="Email">
                        </div>
                        <input type="hidden" name="parent_id" id="parent_id" value="0">
                        <label class="confir_res">
                            <div class="text">I'd read and agree to the terms and conditions.</div>
                            <input type="checkbox" id="comment_confirm" name="comment_confirm">
                            <span class="checkmark"></span>
                        </label>
                        <input type="button" id="btn_cancel_reply" class="submit btn-load-more btn-primary pull-right" value="Cancel" style="display: none;">
                    </div>
                </form>
                <div id="comment_errors"></div>
                <div class="alert-icon arrow" id="alert-icon-loadmore">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                        <path d="M143 256.3L7 120.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0L313 86.3c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.4 9.5-24.6 9.5-34 .1zm34 192l136-136c9.4-9.4 9.4-24.6 0-33.9l-22.6-22.6c-9.4-9.4-24.6-9.4-33.9 0L160 352.1l-96.4-96.4c-9.4-9.4-24.6-9.4-33.9 0L7 278.3c-9.4 9.4-9.4 24.6 0 33.9l136 136c9.4 9.5 24.6 9.5 34 .1z"></path>
                    </svg>
                </div>
            </div>
        </div>
    </div>
`;

    // Set data attributes
    const commentsContainer = container.querySelector('#commentsContainer');
    commentsContainer.setAttribute('data-domain', domain);
    commentsContainer.setAttribute('data-url', url);
    commentsContainer.setAttribute('data-limit', limit); // Set data-limit attribute

    // Initialize comment functionalities
    initializeCommentScripts();
}

function initializeCommentScripts() {
    const commentForm = document.getElementById('comment_form');
    const commentsSection = document.getElementById('list_comment');
    const commentInput = document.getElementById('comment_content');
    const parentIdInput = document.getElementById('parent_id');
    const submitButton = document.getElementById('btn_submit');
    const commentsContainer = document.getElementById('commentsContainer');
    const commentConfirm = document.getElementById('comment_confirm'); // Thêm dòng này

    const cancelReplyButton = document.getElementById('btn_cancel_reply');

    const domain = commentsContainer.getAttribute('data-domain');
    const url = commentsContainer.getAttribute('data-url');
    const limit = parseInt(commentsContainer.getAttribute('data-limit')) || 5; // Get limit from data-limit
    console.log("domain", domain);
    console.log("url", url);
    console.log("limit", limit);
    let originalFormPosition = commentForm.parentNode;

    let currentPage = 1; // Initialize currentPage
    let totalPages = 1; // Initialize totalPages
    let sortBy = 'date'; // Default sorting

    // Autofill user information from localStorage if available
    if (localStorage.getItem('comment_author')) {
        document.getElementById('comment_author').value = localStorage.getItem('comment_author');
    }
    if (localStorage.getItem('comment_email')) {
        document.getElementById('comment_email').value = localStorage.getItem('comment_email');
    }

    // Handle comment form submission
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const comment = commentInput.value.trim();
        const userName = document.getElementById('comment_author').value.trim();
        const userEmail = document.getElementById('comment_email').value.trim();
        const parentId = parentIdInput.value;

        // Validate inputs
        if (!comment || !userName || !userEmail) {
            document.getElementById('comment_errors').innerText = 'Please fill in all fields.';
            return;
        }

         // Validate checkbox
         if (!commentConfirm.checked) {
            document.getElementById('comment_errors').innerText = 'You must agree to the terms and conditions.';
            return;
        }

        // Save user info to localStorage
        localStorage.setItem('comment_author', userName);
        localStorage.setItem('comment_email', userEmail);

        fetch('https://cmt.tbg95.co/api/comment/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment, userName, userEmail, domain, url, parentId })
        })
        .then(response => {
            if (response.ok) {
                currentPage = 1; // Reset to first page after submission
                loadComments();
                commentInput.value = ''; // Reset comment input
                parentIdInput.value = '0';
                moveFormBack();
                document.getElementById('comment_errors').innerText = '';
            } else {
                console.error('Failed to submit comment');
                document.getElementById('comment_errors').innerText = 'Failed to submit comment.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('comment_errors').innerText = 'An error occurred while submitting your comment.';
        });
    });

   // Handle Like action
   window.likeComment = function(id) {
    const interactionKey = `comment_${id}_interaction`;
    const userInteraction = localStorage.getItem(interactionKey);

    if (userInteraction === 'like') {
        // Unlike the comment
        fetch(`https://cmt.tbg95.co/api/comment/unlike/${id}`, { method: 'PATCH' })
        .then(response => {
            if (response.ok) {
                localStorage.removeItem(interactionKey);
            }
        })
        .then(() => {
            currentPage = 1; // Reset to first page to avoid duplication
            loadComments();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    } else {
        // If previously disliked, remove dislike
        if (userInteraction === 'dislike') {
            fetch(`https://cmt.tbg95.co/api/comment/undislike/${id}`, { method: 'PATCH' })
            .then(() => {
                return fetch(`https://cmt.tbg95.co/api/comment/like/${id}`, { method: 'PATCH' });
            })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem(interactionKey, 'like');
                }
            })
            .then(() => {
                currentPage = 1; // Reset to first page to avoid duplication
                loadComments();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            // Like the comment
            fetch(`https://cmt.tbg95.co/api/comment/like/${id}`, { method: 'PATCH' })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem(interactionKey, 'like');
                }
            })
            .then(() => {
                currentPage = 1; // Reset to first page to avoid duplication
                loadComments();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }
};

  // Handle Dislike action
  window.dislikeComment = function(id) {
    const interactionKey = `comment_${id}_interaction`;
    const userInteraction = localStorage.getItem(interactionKey);

    if (userInteraction === 'dislike') {
        // Remove dislike
        fetch(`https://cmt.tbg95.co/api/comment/undislike/${id}`, { method: 'PATCH' })
        .then(response => {
            if (response.ok) {
                localStorage.removeItem(interactionKey);
            }
        })
        .then(() => {
            currentPage = 1; // Reset to first page to avoid duplication
            loadComments();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    } else {
        // If previously liked, remove like
        if (userInteraction === 'like') {
            fetch(`https://cmt.tbg95.co/api/comment/unlike/${id}`, { method: 'PATCH' })
            .then(() => {
                return fetch(`https://cmt.tbg95.co/api/comment/dislike/${id}`, { method: 'PATCH' });
            })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem(interactionKey, 'dislike');
                }
            })
            .then(() => {
                currentPage = 1; // Reset to first page to avoid duplication
                loadComments();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            // Dislike the comment
            fetch(`https://cmt.tbg95.co/api/comment/dislike/${id}`, { method: 'PATCH' })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem(interactionKey, 'dislike');
                }
            })
            .then(() => {
                currentPage = 1; // Reset to first page to avoid duplication
                loadComments();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }
};
        // Handle Reply action
        window.replyComment = function(id, replyButton) {

            parentIdInput.value = id;
            //commentInput.focus();
            moveForm(replyButton);
        };
    
        // Move the comment form to the reply location
        function moveForm(replyButton) {
            const commentDiv = replyButton.closest('.item-comment');
            commentDiv.appendChild(commentForm);
            cancelReplyButton.style.display = 'inline';
        }
    
        // Move the comment form back to its original position
        function moveFormBack() {
            originalFormPosition.appendChild(commentForm);
            cancelReplyButton.style.display = 'none';
        }
    
        // Handle Cancel Reply action
        cancelReplyButton.addEventListener('click', function() {
            parentIdInput.value = '0';
            moveFormBack();
        });
    
        // Hide Cancel button on page load
        window.onload = function() {
            cancelReplyButton.style.display = 'none';
        };
    
        // Handle Sorting Change
        const sortSelect = document.getElementById('sortSelect');
        sortBy = sortSelect.value; // Default is 'date'
    
        sortSelect.addEventListener('change', function() {
            sortBy = sortSelect.value;
            currentPage = 1;
            commentsSection.innerHTML = ''; // Clear existing comments
            loadComments();
        });
    
        // Handle "View More" Button Click
        const viewMoreButton = document.getElementById('viewMoreButton');
    
        viewMoreButton.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                loadComments();
            }
        });
    // Load comments from API
    function loadComments() {
        fetch(`https://cmt.tbg95.co/api/comment?domain=${encodeURIComponent(domain)}&url=${encodeURIComponent(url)}&limit=${limit}&page=${currentPage}&sortBy=${sortBy}`, {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            return response.json();
        })
        .then(data => {
            const comments = data.comments;
            const pagination = data.pagination;

            console.log("data", data);
            // Update totalPages
            totalPages = pagination.totalPages;

            // Clear existing comments if loading the first page
            if (currentPage === 1) {
                commentsSection.innerHTML = '';
            }

            // Render comments
            renderComments(comments, '0', commentsSection);

            // Show or hide "View More" button based on pagination
            if (currentPage < totalPages) {
                showViewMoreButton();
            } else {
                hideViewMoreButton();
            }
        })
        .catch(error => {
            console.error(error);
            // Display error message to user
            document.getElementById('comment_errors').innerText = 'Unable to load comments. Please try again later.';
        });
    }

    // Show "View More" button
    function showViewMoreButton() {
        viewMoreButton.style.display = 'block';
    }

    // Hide "View More" button
    function hideViewMoreButton() {
        viewMoreButton.style.display = 'none';
    }

    // Load CSS files dynamically
    function loadCSS(filename) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = filename;
        document.head.appendChild(link);
    }

    loadCSS('duy.css');
    loadCSS('styles.css');

    // Initialize by loading comments
    loadComments();
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";

    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";

    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";

    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
}

function renderComments(comments, parentId, container) {
    console.log("comments", comments);
    console.log("parentId", parentId);
    console.log("container", container);

    const filteredComments = comments.filter(comment => comment.parentId === parentId);

    filteredComments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('item-comment');
        commentDiv.id = `comment_${comment._id}`;

        // Kiểm tra nếu là phản hồi
        const isReply = comment.parentId !== '0' && comment.parentId !== null && comment.parentId !== undefined;

        // Chỉ hiển thị các nút nếu không phải là phản hồi
        let actionsHTML = '';
        if (!isReply) {
            // Kiểm tra trạng thái tương tác từ localStorage
            const interactionKey = `comment_${comment._id}_interaction`;
            const userInteraction = localStorage.getItem(interactionKey);

            // Xác định lớp CSS cho Like và Dislike
            const likeClass = userInteraction === 'like' ? 'liked' : '';
            const dislikeClass = userInteraction === 'dislike' ? 'disliked' : '';

            actionsHTML = `
                <div class="count-option">
                    <div class="count-option__left">
                        <a class="item reply" onclick="replyComment('${comment._id}', this); return false;">
                            <svg class="icon-svg">
                                <use xlink:href="https://tbglearn.github.io/Box-comment-fe/icon.svg#Reply"></use>
                            </svg>
                            <span>Reply</span>
                        </a>
                        <a class="item vote comment_vote_row_${comment._id} voteUp ${likeClass}" href="#" id="comment_voteup_${comment._id}" onclick="likeComment('${comment._id}'); return false;" title="Vote this comment up (helpful)" rel="nofollow">
                        <svg class="icon-svg"><use xlink:href="https://tbglearn.github.io/Box-comment-fe/icon.svg#Like"></use></svg>
                            <span class="voteUp" id="comment_voteup_count_${comment._id}"> ${comment.like || 0}</span>
                        </a>
                        <a class="item vote comment_vote_row_${comment._id} voteDown ${dislikeClass}" href="javascript:;" onclick="dislikeComment('${comment._id}'); return false;" title="Vote this comment down (not helpful)" rel="nofollow">
                        <svg class="icon-svg" style="color:#000"><use xlink:href="https://tbglearn.github.io/Box-comment-fe/icon.svg#Dislike"></use></svg>
                            <span class="voteDown" id="comment_votedown_count_${comment._id}"> ${comment.dislike || 0}</span>
                        </a>
                    </div>
                    <div class="count-option__right hidden">
                        <a class="item reply" href="#">
                            <svg class="icon-svg">
                                <use xlink:href="https://tbglearn.github.io/Box-comment-fe/icon.svg#Dotted"></use>
                            </svg>
                        </a>
                    </div>
                </div>
            `;
        }

        commentDiv.innerHTML = `
            <div class="user_status">
                <a class="avata_coment" href="#" title="${comment.userName}">
                    ${comment.userName.charAt(0)}
                </a>
                <div class="sum-user">
                    <span class="txt-name">${comment.userName}</span>
                    <span class="time-com">${timeSince(comment.date)}</span>
                </div>
            </div>
            <div class="content-comment">
                <p>${escapeHTML(comment.comment)}</p>
                ${actionsHTML}
            </div>
        `;
        container.appendChild(commentDiv);

        const repliesContainer = document.createElement('div');
        repliesContainer.classList.add('replies');
        commentDiv.appendChild(repliesContainer);

        // Đệ quy để hiển thị các phản hồi
        renderComments(comments, comment._id, repliesContainer);
    });
}

// Utility function to escape HTML to prevent XSS
function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}