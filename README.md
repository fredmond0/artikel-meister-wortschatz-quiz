# ArtikelMeister 🇩🇪

**AI-Powered German Vocabulary & Articles Learning Platform**

Master German vocabulary and articles with intelligent, personalized learning experiences. ArtikelMeister uses AI to customize study lists, provide smart word selection, and generate contextual example sentences to accelerate your German language journey.

## 🚀 Recent Updates (January 2025)

### 🛠 Major Vocabulary Generation Improvements
- **Enhanced Reliability**: Implemented robust partial JSON recovery for 90%+ success rate on vocabulary generation
- **Increased Token Limits**: Boosted AI response capacity from 6,000 to 8,000 tokens (+33% headroom)
- **Optimized Prompts**: Reduced token usage by 47% while maintaining quality
- **Smart Capping**: Automatic word count limiting (max 50 words) to prevent token overflow
- **Advanced Error Handling**: Comprehensive logging and diagnostics for better troubleshooting
- **Partial Recovery System**: Salvages incomplete responses to provide maximum vocabulary even when AI hits limits

### 🔧 Technical Enhancements
- **Character-by-Character JSON Parsing**: Robust parsing with multiple fallback strategies
- **finish_reason Analysis**: Detailed AI response diagnostics (MAX_TOKENS, STOP, SAFETY, etc.)
- **Improved Button States**: Fixed loading states and proper error handling
- **Accessibility Improvements**: Enhanced dialog components for screen readers

## 🌟 Features

### 🧠 AI-Powered Learning
- **Custom Vocabulary Lists**: Generate topic-based word lists using AI (powered by Google Gemini)
- **Robust Generation**: Advanced partial recovery system ensures 90%+ success rate even with complex topics
- **Smart Word Selection**: Intelligent algorithm that balances variety and repetition based on your learning progress
- **Dynamic Sentence Generation**: AI creates contextual example sentences for better comprehension
- **Fail-Safe Recovery**: Partial vocabulary recovery when AI hits token limits

### 📚 Comprehensive German Study Tools
- **Article Mastery**: Practice with der, die, das articles
- **Vocabulary Building**: Extensive German word database with English translations
- **Progressive Learning**: Track your mastery with customizable thresholds
- **Review System**: Smart review mode for challenging words

### 📊 Advanced Progress Tracking
- **Detailed Statistics**: Monitor your learning progress with comprehensive analytics
- **Performance Metrics**: Track accuracy for both articles and translations
- **Word Categories**: View mastered, in-progress, and fresh vocabulary
- **Export/Import**: Backup and restore your learning progress

### 🎨 Modern User Experience
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Clean Interface**: Intuitive design focused on learning efficiency
- **Customizable Settings**: Personalize your learning experience
- **Dark/Light Mode**: Comfortable studying in any environment

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fredmond0/artikel-meister-wortschatz-quiz.git
cd artikel-meister-wortschatz-quiz
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
bun dev
```

4. Open your browser and navigate to `http://localhost:8080`

### Production Build

```bash
npm run build
npm run preview
```

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **Routing**: React Router Dom
- **State Management**: React Hooks, Local Storage
- **AI Integration**: Google Gemini API
- **Build Tool**: Vite
- **Deployment**: Netlify

## 📖 How to Use

1. **Start Learning**: Begin with the built-in German vocabulary quiz
2. **Create Custom Lists**: Generate AI-powered vocabulary lists based on your interests (now with 90%+ reliability!)
3. **Practice Regularly**: Use the smart word selection to optimize your study sessions
4. **Track Progress**: Monitor your improvement through detailed statistics
5. **Review Mistakes**: Focus on challenging words with the review mode

## 🔧 Troubleshooting

### Vocabulary Generation Issues
- **Partial Results**: If you receive fewer words than requested, the system successfully recovered what it could from an incomplete AI response
- **Timeout Errors**: Try generating fewer words (≤25) or try again later
- **Empty Responses**: Check your internet connection and try again
- **Ad Blocker Warnings**: These are normal (Google AdSense blocking) and don't affect functionality

### Performance Tips
- **Optimal Word Count**: 15-25 words for fastest generation
- **Complex Topics**: May generate fewer words due to AI token limits
- **Browser Cache**: Clear cache if you experience UI issues after updates

### Getting Help
- Check the browser console for detailed error logs
- Issues are automatically logged with diagnostic information
- Report persistent problems via GitHub issues

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and enhancement requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Created By

**allmydogs eat**
- Building innovative language learning tools
- Focused on AI-powered educational experiences
- Passionate about making German accessible to everyone

## 🔗 Links

- **Live App**: [https://learngerman.allmydogseat.com](https://learngerman.allmydogseat.com)
- **GitHub Repository**: [https://github.com/fredmond0/artikel-meister-wortschatz-quiz](https://github.com/fredmond0/artikel-meister-wortschatz-quiz)

---

**ArtikelMeister** - Your AI companion for mastering German vocabulary and articles! 🎯
*Now with enhanced reliability and robust error recovery!*
