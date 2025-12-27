'use client';

import { useState, useEffect, useRef } from 'react';

type InquiryType = 'fulltime' | 'project' | '';

interface FormState {
  name: string;
  email: string;
  inquiryType: InquiryType;
  company: string;
  message: string;
  attachments: File[];
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 3;

export default function ContactForm() {
  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    inquiryType: '',
    company: '',
    message: '',
    attachments: [],
  });
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormLoadedAt(Math.floor(Date.now() / 1000));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMessage(`File type ${ext} not allowed`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('File too large (max 10MB)');
        return;
      }
    }

    const newFiles = [...formState.attachments, ...files].slice(0, MAX_FILES);
    setFormState((prev) => ({ ...prev, attachments: newFiles }));
    setErrorMessage('');
  };

  const removeFile = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    // Basic validation
    if (!formState.name || !formState.email || !formState.inquiryType || !formState.message) {
      setErrorMessage('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (formState.message.length < 20) {
      setErrorMessage('Please provide more details in your message');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', formState.name);
      formData.append('email', formState.email);
      formData.append('inquiry_type', formState.inquiryType);
      formData.append('company', formState.company);
      formData.append('message', formState.message);
      formData.append('form_loaded_at', formLoadedAt.toString());
      formData.append('website', honeypot); // Honeypot

      formState.attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch('https://api.itsjesse.dev/contact', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormState({
        name: '',
        email: '',
        inquiryType: '',
        company: '',
        message: '',
        attachments: [],
      });
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-[#1a1a24] rounded-2xl p-8 border border-white/10 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
        <p className="text-gray-400 mb-6">Thank you for reaching out. I&apos;ll get back to you soon.</p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a24] rounded-2xl p-8 border border-white/10">
      {/* Honeypot - hidden from users */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-6">
        {/* Inquiry Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What are you looking for? <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormState((prev) => ({ ...prev, inquiryType: 'fulltime' }))}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formState.inquiryType === 'fulltime'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="font-medium text-white">Full-Time Hire</div>
              <div className="text-sm text-gray-400">Employment opportunity</div>
            </button>
            <button
              type="button"
              onClick={() => setFormState((prev) => ({ ...prev, inquiryType: 'project' }))}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formState.inquiryType === 'project'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="font-medium text-white">Project Work</div>
              <div className="text-sm text-gray-400">Freelance or contract</div>
            </button>
          </div>
        </div>

        {/* Name & Email Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="you@company.com"
              required
            />
          </div>
        </div>

        {/* Company (optional) */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
            Company <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formState.company}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Company name"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formState.message}
            onChange={handleInputChange}
            rows={5}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            placeholder={
              formState.inquiryType === 'fulltime'
                ? "Tell me about the role and your team..."
                : formState.inquiryType === 'project'
                ? "Describe your project and goals..."
                : "Tell me about your opportunity..."
            }
            required
          />
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Attachments <span className="text-gray-500">(optional, max 3 files)</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-white/20 transition-colors"
          >
            <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-400 text-sm">Click to upload or drag and drop</p>
            <p className="text-gray-500 text-xs mt-1">PDF, DOC, TXT, PNG, JPG up to 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Attached files list */}
          {formState.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {formState.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formState.inquiryType}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  );
}
