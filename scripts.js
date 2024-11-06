function initializeComments(domain, url, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="comments-container" id="commentsContainer">
            <div class="box-comment mb16">
                <div class="header-comment flex-comment">
                    <div class="title-comment">Comment</div>
                </div>
                <div id="comments_area">
                    <div class="comment_loading"></div>
                    <div class="main-comment scrollbar-inner" id="list_comment"></div>
                </div>
                <div class="make-comment">
                    <form id="comment_form" class="form-group" autocomplete="off" novalidate="novalidate">
                        <div class="form-default box-area-input">
                            <textarea class="form-control" id="comment_content" name="comment_content" placeholder="Add comment"></textarea>
                            <div class="send-comment">
                                <button type="submit" class="send" id="btn_submit">
                                    <svg class="icon-svg"><use xlink:href="/themes/bitlife/resources/images/icons/icon.svg#Send"></use></svg>
                                </button>
                            </div>
                        </div>
                        <div class="form-default">
                            <div class="form-group">
                                <input type="text" id="comment_author" name="comment_author" class="form-control" placeholder="Name">
                            </div>
                            <div class="form-group">
                                <input type="email" class="form-control" id="comment_email" autocomplete="off" name="comment_email" placeholder="Email">
                            </div>
                            <input type="hidden" name="parent_id" id="parent_id" value="0">
                            <input type="button" onclick="reply_all(); return false;" id="btn_cancel" class="submit btn-load-more btn-primary pull-right hidden" value="Cancel">
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

    // Đặt các thuộc tính data-domain và data-url
    const commentsContainer = container.querySelector('#commentsContainer');
    commentsContainer.setAttribute('data-domain', domain);
    commentsContainer.setAttribute('data-url', url);

    // Khởi chạy các chức năng bình thường
    initializeCommentScripts();
}

function initializeCommentScripts() {
    const commentForm = document.getElementById('comment_form');
    const commentsSection = document.getElementById('list_comment');
    const commentInput = document.getElementById('comment_content');
    const parentIdInput = document.getElementById('parent_id');
    const submitButton = document.getElementById('btn_submit');
    const cancelButton = document.getElementById('btn_cancel');
    const commentsContainer = document.getElementById('commentsContainer');

    const domain = commentsContainer.getAttribute('data-domain');
    const url = commentsContainer.getAttribute('data-url');
    console.log("domain", domain);
    console.log("url", url);
    let originalFormPosition = commentForm.parentNode;

    // Tự động điền thông tin người dùng nếu có trong localStorage
    if (localStorage.getItem('comment_author')) {
        document.getElementById('comment_author').value = localStorage.getItem('comment_author');
    }
    if (localStorage.getItem('comment_email')) {
        document.getElementById('comment_email').value = localStorage.getItem('comment_email');
    }

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const comment = commentInput.value;
        const userName = document.getElementById('comment_author').value;
        const userEmail = document.getElementById('comment_email').value;
        const parentId = parentIdInput.value;

        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem('comment_author', userName);
        localStorage.setItem('comment_email', userEmail);

        const response = await fetch('https://cmt.tbg95.co/api/comment/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment, userName, userEmail, domain, url, parentId })
        });

        if (response.ok) {
            loadComments();
            commentInput.value = ''; // Chỉ reset nội dung comment
            parentIdInput.value = '0';
            moveFormBack();
        } else {
            console.error('Failed to submit comment');
        }
    });

    async function loadComments() {
        const domain = commentsContainer.getAttribute('data-domain');
        const url = commentsContainer.getAttribute('data-url');
        const response = await fetch(`https://cmt.tbg95.co/api/comment?domain=${encodeURIComponent(domain)}&url=${encodeURIComponent(url)}`, {
            method: 'GET'
        });
        const comments = await response.json();
        commentsSection.innerHTML = '';
        renderComments(comments, '0', commentsSection);
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

    function loadCSS(filename) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = filename;
        document.head.appendChild(link);
    }
    
    // Tải duy.css và styles.css
    loadCSS('duy.css');
    loadCSS('styles.css');

    function renderComments(comments, parentId, container) {
        const filteredComments = comments.filter(comment => comment.parentId === parentId);
        filteredComments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('item-comment');
            commentDiv.id = `comment_${comment._id}`;
            
            // Kiểm tra trạng thái tương tác từ localStorage
            const interactionKey = `comment_${comment._id}_interaction`;
            const userInteraction = localStorage.getItem(interactionKey);
            
            // Xác định các lớp CSS cho Like và Dislike
            const likeClass = userInteraction === 'like' ? 'liked' : '';
            const dislikeClass = userInteraction === 'dislike' ? 'disliked' : '';
            
            commentDiv.innerHTML = `
                <div class="user_status">
                    <a class="avata_coment" href="#" title="${comment.userName}">${comment.userName.charAt(0)}</a>
                    <div class="sum-user">
                        <span class="txt-name">${comment.userName}</span>
                        <span class="time-com">${timeSince(comment.date)}</span>
                    </div>
                </div>
                <div class="content-comment">
                    <p>${comment.comment}</p>
                    <div class="count-option">
                        <div class="count-option__left">
                            <a class="item reply" href="#">
                                <svg class="icon-svg">
                                    <use xlink:href="/themes/bitlife/resources/images/icons/icon.svg#Reply"></use>
                                </svg>
                                <span onclick="replyComment('${comment._id}', this)">Reply</span>
                            </a>
                            <a class="item vote comment_vote_row_${comment._id} voteUp ${likeClass}" href="#" id="comment_voteup_${comment._id}" onclick="likeComment('${comment._id}'); return false;" title="Vote this comment up (helpful)" rel="nofollow">
                                <span class="voteUp" id="comment_voteup_count_${comment._id}">Like ${comment.like || 0}</span>
                            </a>
                            <a class="item vote comment_vote_row_${comment._id} voteDown ${dislikeClass}" href="javascript:;" onclick="dislikeComment('${comment._id}'); return false;" title="Vote this comment down (not helpful)" rel="nofollow">
                                <span class="voteDown" id="comment_votedown_count_${comment._id}">DisLike ${comment.dislike || 0}</span>
                            </a>
                        </div>
                        <div class="count-option__right hidden">
                            <a class="item reply" href="#">
                                <svg class="icon-svg">
                                    <use xlink:href="/themes/bitlife/resources/images/icons/icon.svg#Dotted"></use>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(commentDiv);
            
            const repliesContainer = document.createElement('div');
            repliesContainer.classList.add('replies');
            commentDiv.appendChild(repliesContainer);
            renderComments(comments, comment._id, repliesContainer);
        });
    }

    window.likeComment = async (id) => {
        const interactionKey = `comment_${id}_interaction`;
        const userInteraction = localStorage.getItem(interactionKey);
    
        if (userInteraction === 'like') {
            // Hủy Like
            const response = await fetch(`https://cmt.tbg95.co/api/comment/unlike/${id}`, { method: 'PATCH' });
            if (response.ok) {
                localStorage.removeItem(interactionKey);
                loadComments();
            }
        } else {
            // Nếu đã Dislike, hủy Dislike trước
            if (userInteraction === 'dislike') {
                await fetch(`https://cmt.tbg95.co/api/comment/undislike/${id}`, { method: 'PATCH' });
            }
            // Thực hiện Like
            const response = await fetch(`https://cmt.tbg95.co/api/comment/like/${id}`, { method: 'PATCH' });
            if (response.ok) {
                localStorage.setItem(interactionKey, 'like');
                loadComments();
            }
        }
    };
    
    window.dislikeComment = async (id) => {
        const interactionKey = `comment_${id}_interaction`;
        const userInteraction = localStorage.getItem(interactionKey);
    
        if (userInteraction === 'dislike') {
            // Hủy Dislike
            const response = await fetch(`https://cmt.tbg95.co/api/comment/undislike/${id}`, { method: 'PATCH' });
            if (response.ok) {
                localStorage.removeItem(interactionKey);
                loadComments();
            }
        } else {
            // Nếu đã Like, hủy Like trước
            if (userInteraction === 'like') {
                await fetch(`https://cmt.tbg95.co/api/comment/unlike/${id}`, { method: 'PATCH' });
            }
            // Thực hiện Dislike
            const response = await fetch(`https://cmt.tbg95.co/api/comment/dislike/${id}`, { method: 'PATCH' });
            if (response.ok) {
                localStorage.setItem(interactionKey, 'dislike');
                loadComments();
            }
        }
    };

    window.replyComment = (id, replyButton) => {
        parentIdInput.value = id;
        commentInput.focus();
        moveForm(replyButton);
    };

    function moveForm(replyButton) {
        const commentDiv = replyButton.closest('.item-comment');
        commentDiv.appendChild(commentForm);
        cancelButton.style.display = 'inline';
    }

    function moveFormBack() {
        originalFormPosition.appendChild(commentForm);
        cancelButton.style.display = 'none';
    }

    cancelButton.addEventListener('click', () => {
        parentIdInput.value = '0';
        moveFormBack();
    });

    loadComments();
}