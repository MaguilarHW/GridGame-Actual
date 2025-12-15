import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import ViewProfile from "./ViewProfile";
import "./PermissionsDemo.css";

function PublicContent() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [viewingProfile, setViewingProfile] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "publicContent"),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const postsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPosts(postsData);
          setLoading(false);
        },
        (error) => {
          console.error("Error loading posts:", error);
          setMessage("Error loading posts: " + error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up posts listener:", error);
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!auth?.currentUser || !db) {
      setMessage("You must be logged in to create posts.");
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      setMessage("Please fill in both title and content.");
      return;
    }

    setPosting(true);
    setMessage("");

    try {
      await addDoc(collection(db, "publicContent"), {
        title: newPost.title,
        content: newPost.content,
        author: auth.currentUser.displayName || auth.currentUser.email,
        authorId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      });
      setNewPost({ title: "", content: "" });
      setMessage("Post created successfully! ✅");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error creating post:", error);
      setMessage("Error creating post: " + error.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId, authorId) => {
    if (!auth?.currentUser || !db) {
      setMessage("You must be logged in to delete posts.");
      return;
    }

    if (auth.currentUser.uid !== authorId) {
      setMessage("You can only delete your own posts.");
      return;
    }

    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "publicContent", postId));
      setMessage("Post deleted successfully! ✅");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting post:", error);
      setMessage("Error deleting post: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="permissions-demo">
        <div className="demo-card public-access">
          <h3>🌐 Public Content (Everyone Can Read)</h3>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = auth?.currentUser !== null;

  return (
    <div className="permissions-demo">
      <div className="demo-card public-access">
        <h3>🌐 Public Content (Everyone Can Read)</h3>
        <p className="permission-info">
          This content is accessible to everyone (logged in or not). Anyone can
          read posts, but only authenticated users can create, update, or delete
          posts.
        </p>

        {message && (
          <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        {isAuthenticated && (
          <div className="create-post">
            <h4>Create a New Post</h4>
            <div className="form-group">
              <input
                type="text"
                value={newPost.title}
                onChange={(e) =>
                  setNewPost({ ...newPost, title: e.target.value })
                }
                placeholder="Post title"
              />
            </div>
            <div className="form-group">
              <textarea
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
                placeholder="Post content..."
                rows={3}
              />
            </div>
            <button
              onClick={handleCreatePost}
              disabled={posting}
              className="create-button"
            >
              {posting ? "Posting..." : "Create Post"}
            </button>
          </div>
        )}

        {!isAuthenticated && (
          <div className="auth-prompt">
            <p>💡 Log in to create and manage posts!</p>
          </div>
        )}

        <div className="posts-list">
          <h4>Recent Posts</h4>
          {posts.length === 0 ? (
            <p className="no-posts">No posts yet. Be the first to post!</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <h5>{post.title}</h5>
                  {isAuthenticated &&
                    auth.currentUser.uid === post.authorId && (
                      <button
                        onClick={() => handleDeletePost(post.id, post.authorId)}
                        className="delete-button"
                      >
                        🗑️ Delete
                      </button>
                    )}
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <span className="post-author">
                    By:{" "}
                    <span
                      className="post-author-link"
                      onClick={() =>
                        setViewingProfile({
                          userId: post.authorId,
                          userName: post.author,
                        })
                      }
                      title="Click to view profile"
                    >
                      {post.author}
                    </span>
                  </span>
                  <span className="post-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {viewingProfile && (
        <ViewProfile
          userId={viewingProfile.userId}
          userName={viewingProfile.userName}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
  );
}

export default PublicContent;

