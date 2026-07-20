import React, { useState } from 'react';
import { X, Send, Phone, Mail, MessageSquare } from 'lucide-react';

const HelpPopup = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    console.log('Help request submitted:', formData);
    
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', category: '', message: '', priority: 'medium' });
      onClose();
    }, 3000);
  };

  const categories = [
    'Account Issues',
    'Feature Support', 
    'Technical Problems',
    'Billing & Subscriptions',
    'Privacy & Security',
    'General Inquiry'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Help & Support</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-emerald-650" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Request Submitted!</h3>
              <p className="text-muted-foreground">
                Your support request has been received. We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Help Form */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Submit Support Request</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    >
                      <option value="low">Low - General inquiry</option>
                      <option value="medium">Medium - Feature issue</option>
                      <option value="high">High - Account problem</option>
                      <option value="urgent">Urgent - Security concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Please describe your issue..."
                      required
                    />
                  </div>

                  <button type="submit" className="btn-hero w-full flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Submit Request</span>
                  </button>
                </form>
              </div>

              {/* Contact Options */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Other Ways to Reach Us</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border border-border/50 rounded-lg bg-warm-50/50">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">24/7 Hotline</p>
                        <p className="text-xs text-muted-foreground">1800-SAARTHI</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border border-border/50 rounded-lg bg-warm-50/50">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Email Support</p>
                        <p className="text-xs text-muted-foreground">support@saarthi.health</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border border-border/50 rounded-lg bg-warm-50/50">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Live Chat</p>
                        <p className="text-xs text-muted-foreground">9 AM - 9 PM IST</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <h4 className="font-semibold text-sm mb-3">Quick Help Articles</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 border border-border/55 rounded-lg text-xs font-semibold hover:bg-muted transition-colors">
                      How to track my period?
                    </button>
                    <button className="w-full text-left px-3 py-2 border border-border/55 rounded-lg text-xs font-semibold hover:bg-muted transition-colors">
                      Booking consultations
                    </button>
                    <button className="w-full text-left px-3 py-2 border border-border/55 rounded-lg text-xs font-semibold hover:bg-muted transition-colors">
                      Government schemes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpPopup;
