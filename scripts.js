document.addEventListener('DOMContentLoaded', () => {
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

        const response = await fetch('http://localhost:3006/api/comment/create', {
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
        const response = await fetch(`http://localhost:3006/api/comment?domain=${encodeURIComponent(domain)}&url=${encodeURIComponent(url)}`, {
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

    function renderComments(comments, parentId, container) {
        const filteredComments = comments.filter(comment => comment.parentId === parentId);
        filteredComments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('item-comment');
            commentDiv.id = `comment_${comment._id}`;
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
                                <svg class="icon-svg"><use xlink:href="/themes/bitlife/resources/images/icons/icon.svg#Reply"></use></svg>
                                <span onclick="replyComment('${comment._id}', this)">Reply</span>
                            </a>
                            <a class="item vote comment_vote_row_${comment._id} voteUp" href="#" id="comment_voteup_${comment._id}" onclick="likeComment('${comment._id}'); return false;" title="Vote this comment up (helpful)" rel="nofollow">
                                <span class="voteUp" id="comment_voteup_count_${comment._id}">Like ${comment.like || 0}</span>
                            </a>
                            <a class="item vote comment_vote_row_${comment._id} voteDown" href="javascript:;" onclick="dislikeComment('${comment._id}'); return false;" title="Vote this comment down (not helpful)" rel="nofollow">
                                <span class="voteDown" id="comment_votedown_count_${comment._id}">DisLike ${comment.dislike || 0}</span>
                            </a>
                        </div>
                        <div class="count-option__right hidden">
                            <a class="item reply" href="#">
                                <svg class="icon-svg"><use xlink:href="/themes/bitlife/resources/images/icons/icon.svg#Dotted"></use></svg>
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
    
        if (userInteraction) {
            alert('Bạn đã tương tác với bình luận này rồi.');
            return;
        }
    
        const response = await fetch(`https://cmt.tbg95.co/api/comment/like/${id}`, { method: 'PATCH' });
        if (response.ok) {
            localStorage.setItem(interactionKey, 'like');
            loadComments();
        }
    };
    
    window.dislikeComment = async (id) => {
        const interactionKey = `comment_${id}_interaction`;
        const userInteraction = localStorage.getItem(interactionKey);
    
        if (userInteraction) {
            alert('Bạn đã tương tác với bình luận này rồi.');
            return;
        }
    
        const response = await fetch(`https://cmt.tbg95.co/api/comment/dislike/${id}`, { method: 'PATCH' });
        if (response.ok) {
            localStorage.setItem(interactionKey, 'dislike');
            loadComments();
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
});