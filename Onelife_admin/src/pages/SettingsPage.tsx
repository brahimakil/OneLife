import { useState, useEffect } from 'react';
import { MdSave, MdVpnKey } from 'react-icons/md';
import './SettingsPage.css';

const SettingsPage = () => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setSavedKey(savedApiKey);
      setGeminiApiKey(savedApiKey);
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('geminiApiKey', geminiApiKey);
      setSavedKey(geminiApiKey);
      setTestResult({ success: true, message: 'API key saved successfully!' });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save API key' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!geminiApiKey) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Say hello'
              }]
            }]
          })
        }
      );

      if (response.ok) {
        setTestResult({ success: true, message: 'API key is valid and working!' });
      } else {
        const error = await response.json();
        setTestResult({ 
          success: false, 
          message: error.error?.message || 'API key is invalid' 
        });
      }
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.message || 'Failed to test API key' 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Configure your admin panel settings</p>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="card-header">
            <MdVpnKey className="card-icon" />
            <div>
              <h2>Gemini API Configuration</h2>
              <p>Configure your Google Gemini API key for AI-powered exercise generation</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="input-group">
              <label htmlFor="geminiKey" className="input-label">
                Gemini API Key
              </label>
              <input
                id="geminiKey"
                type="password"
                className="input-field"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <small className="input-hint">
                Get your API key from{' '}
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Google AI Studio
                </a>
              </small>
            </div>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.message}
              </div>
            )}

            <div className="settings-actions">
              <button 
                className="btn btn-outline" 
                onClick={handleTest}
                disabled={testing || !geminiApiKey}
              >
                {testing ? 'Testing...' : 'Test API Key'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={saving || !geminiApiKey}
              >
                <MdSave />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {savedKey && (
              <div className="saved-indicator">
                ✓ API key is configured and saved
              </div>
            )}
          </div>
        </div>

        <div className="settings-info">
          <h3>About Gemini AI Integration</h3>
          <p>
            The Gemini API key enables AI-powered features in your admin panel:
          </p>
          <ul>
            <li>Auto-fill exercise details based on exercise name</li>
            <li>Generate exercise instructions automatically</li>
            <li>Suggest nutritional burn data for exercises</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
