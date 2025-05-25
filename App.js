import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [filters, setFilters] = useState({
    maxPrice: 5000,
    brand: '',
    color: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your fashion assistant. I can help you find the perfect style and adjust your search filters. What are you looking for today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSearch = async (query) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5001/get-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters
        }),
      });
      
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Search error:', error);
      const mockProducts = [
        {
          title: "Stylish Summer Dress",
          price: "₹2,499",
          image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop",
          source: "Myntra",
          link: "#",
          merchant: "Myntra"
        },
        {
          title: "Casual Denim Jacket",
          price: "₹3,999",
          image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=400&fit=crop",
          source: "Ajio",
          link: "#",
          merchant: "Ajio"
        }
      ];
      setProducts(mockProducts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedFile) {
      alert('Please upload an image first');
      return;
    }
  
    setIsAnalyzing(true);
  
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("filters", JSON.stringify({
        brand: filters.brand,
        color: filters.color,
        style: filters.style || '',
        maxPrice: filters.maxPrice
      }));
  
      const analysisResponse = await fetch('http://localhost:5001/analyze-image', {
        method: 'POST',
        body: formData,
      });
  
      const data = await analysisResponse.json();
      if (data.description) {
        setImageDescription(data.description);
        setCurrentCaption(data.description);
        await handleSearch(data.description);
        setActiveTab('results');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      const fallbackDescription = 'stylish casual wear';
      setImageDescription(fallbackDescription);
      await handleSearch(fallbackDescription);
      setActiveTab('results');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
  
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (userMessage) => {
    setIsChatLoading(true);
  
    try {
      const response = await fetch("http://localhost:5001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          filters: filters,
          current_caption: currentCaption,
        }),
      });
  
      const data = await response.json();
  
      if (data.error) {
        console.error("Chat API error:", data.error);
        return;
      }
  
      setProducts(data.products);
      setCurrentCaption(data.new_caption);
      setFilters(data.filters);
  
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.response }
      ]);
  
      setInputMessage('');
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };
  const addToCart = (product) => {
    setCart([...cart, product]);
    alert(`${product.title} added to cart!`);
  };
  
  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };
  
  const handleCartCheckout = async () => {
    try {
      const response = await fetch("http://localhost:5001/create-cart-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart: cart,
          user_id: "user123" // Replace with actual user ID in a real app
        }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleCheckout = async (product) => {
    try {
      const response = await fetch("http://localhost:5000/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  const handleAddToCart = (product) => {
    setCart(prevCart => [...prevCart, product]);
    alert(`${product.title} added to cart!`);
  };

  const popularColors = ['Red', 'Blue', 'Black', 'White', 'Pink', 'Green'];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="m16 10-4 4-4-4"/>
                </svg>
              </div>
              <span className="logo-text">StyleFinder</span>
            </div>
            
            <nav className="nav">
              <a href="#" className="nav-link">Trending</a>
              <a href="#" className="nav-link">Categories</a>
              <a href="#" className="nav-link">Brands</a>
            </nav>
            
            <div className="header-actions">
              <button className="icon-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <button className="icon-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
            </div>
            <div className="header-actions">
              <button className="icon-button" onClick={() => setShowCart(!showCart)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {cart.length > 0 && (
                  <span className="cart-badge">{cart.length}</span>
                )}
              </button>
              {/* Other header buttons... */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          <div className="hero">
            <h1 className="hero-title">StyleFinder AI</h1>
            <p className="hero-subtitle">
              Upload a fashion image, set your preferences, and discover similar styles.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <div className="tab-container">
              <button
                onClick={() => setActiveTab('upload')}
                className={`tab ${activeTab === 'upload' ? 'tab-active' : ''}`}
              >
                Upload & Analyze
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`tab ${activeTab === 'results' ? 'tab-active' : ''}`}
              >
                Results
              </button>
            </div>
          </div>

          <div className="content-grid">
            <div className="main-content">
              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="tab-content">
                  <div className="upload-card">
                    <div className="upload-header">
                      <svg className="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <h2 className="upload-title">Upload Fashion Image</h2>
                      <p className="upload-subtitle">Upload an image and set your preferences to find similar items</p>
                    </div>
                    
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`upload-area ${isDragging ? 'upload-area-dragging' : ''}`}
                    >
                      {uploadedImage ? (
                        <div className="upload-preview">
                          <img src={uploadedImage} alt="Uploaded" className="upload-image" />
                          <button
                            onClick={() => document.getElementById('file-input').click()}
                            className="upload-button"
                            style={{ marginTop: '1rem' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7,10 12,15 17,10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            <span>Upload Different Image</span>
                          </button>
                        </div>
                      ) : (
                        <div className="upload-content">
                          <svg className="upload-drop-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          <p className="upload-text">Drag and drop your image here</p>
                          <p className="upload-or">or</p>
                          <button
                            onClick={() => document.getElementById('file-input').click()}
                            className="upload-button"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7,10 12,15 17,10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            <span>Choose File</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Filter Panel */}
                  <div className="filter-card">
                    <h2 className="filter-title">Set Your Preferences</h2>
                    
                    <div className="filter-section">
                      <div className="filter-group">
                        <label className="filter-label">
                          Max Price: ₹{filters.maxPrice}
                        </label>
                        <input
                          type="range"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                          max="10000"
                          min="500"
                          step="100"
                          className="price-slider"
                        />
                        <div className="price-range">
                          <span>₹500</span>
                          <span>₹10,000</span>
                        </div>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Brand</label>
                        <input
                          type="text"
                          value={filters.brand}
                          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                          placeholder="Enter brand name..."
                          className="filter-input"
                        />
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Color</label>
                        <input
                          type="text"
                          value={filters.color}
                          onChange={(e) => setFilters({ ...filters, color: e.target.value })}
                          placeholder="Enter color..."
                          className="filter-input"
                        />
                        <div className="color-tags">
                          {popularColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setFilters({ ...filters, color })}
                              className={`color-tag ${
                                filters.color.toLowerCase() === color.toLowerCase() ? 'color-tag-active' : ''
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleAnalyzeImage}
                        disabled={isAnalyzing || !uploadedImage}
                        className="analyze-button"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="spinner" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
                            </svg>
                            <span>Analyze & Find Products</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'results' && (
                <div className="results-card">
                  {imageDescription && (
                    <div className="analysis-result">
                      <h3>Image Analysis:</h3>
                      <p>"{imageDescription}"</p>
                    </div>
                  )}
                  
                  {isLoading ? (
                    <div className="loading-grid">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="product-skeleton">
                          <div className="skeleton-image"></div>
                          <div className="skeleton-title"></div>
                          <div className="skeleton-price"></div>
                        </div>
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="no-results">
                      <p>No products found. Upload an image and analyze it first!</p>
                    </div>
                  ) : (
                    <>
                      <h2 className="results-title">Found {products.length} items</h2>
                      <div className="products-grid">
                        {products.map((product, index) => (
                          <div key={index} className="product-card">
                            <div className="product-image-container">
                              <img
                                src={product.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop"}
                                alt={product.title}
                                className="product-image"
                              />
                              <button className="favorite-button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                              </button>
                            </div>
                            <div className="product-info">
                              <h3 className="product-title">{product.title}</h3>
                              <p className="product-price">{product.price}</p>
                              <div className="product-footer">
                                <span className="product-source">{product.source}</span>
                                <div className="product-actions">
                                <button
                                  onClick={() => addToCart(product)}
                                  className="add-to-cart-button"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="21" r="1"/>
                                    <circle cx="20" cy="21" r="1"/>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                  </svg>
                                  <span>Add to Cart</span>
                                </button>
                                  <button
                                    onClick={() => handleCheckout(product)}
                                    className="buy-now-button"
                                  >
                                    <span>Buy Now</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                      <line x1="3" y1="6" x2="21" y2="6"/>
                                      <path d="m16 10-4 4-4-4"/>
                                    </svg>
                                  </button>
                                </div>
                                <a
                                  href={product.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="product-link"
                                >
                                  <span>View</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15,3 21,3 21,9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* Chat Assistant */}
            <div className="chat-sidebar">
              <div className="chat-card">
                <div className="chat-header">
                  <div className="chat-bot-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="5" r="2"/>
                      <path d="M12 7v4"/>
                      <line x1="8" y1="16" x2="8" y2="16"/>
                      <line x1="16" y1="16" x2="16" y2="16"/>
                    </svg>
                  </div>
                  <h3 className="chat-title">Style Assistant</h3>
                </div>

                <div className="chat-messages">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="message-avatar message-avatar-bot">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <circle cx="12" cy="5" r="2"/>
                            <path d="M12 7v4"/>
                            <line x1="8" y1="16" x2="8" y2="16"/>
                            <line x1="16" y1="16" x2="16" y2="16"/>
                          </svg>
                        </div>
                      )}
                      <div className="message-content">
                        <p>{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="message-avatar message-avatar-user">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="message message-assistant">
                      <div className="message-avatar message-avatar-bot">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <circle cx="12" cy="5" r="2"/>
                          <path d="M12 7v4"/>
                          <line x1="8" y1="16" x2="8" y2="16"/>
                          <line x1="16" y1="16" x2="16" y2="16"/>
                        </svg>
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-input-container">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about fashion, filters, or styles..."
                    className="chat-input"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isChatLoading || !inputMessage.trim()}
                    className="chat-send-button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showCart && (
          <div className="cart-drawer">
            <div className="cart-header">
              <h3>Your Cart ({cart.length})</h3>
              <button onClick={() => setShowCart(false)} className="close-cart">
                &times;
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <img src={item.image} alt={item.title} className="cart-item-image" />
                    <div className="cart-item-details">
                      <h4>{item.title}</h4>
                      <p>{item.price}</p>
                      <button 
                        onClick={() => removeFromCart(index)}
                        className="remove-item"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <div className="cart-footer">
                <button 
                  onClick={handleCartCheckout}
                  className="checkout-button"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
