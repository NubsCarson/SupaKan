import type { Database } from './database.types';

export type TaskTemplate = {
  title: string;
  description: string;
  status: Database['public']['Tables']['tasks']['Row']['status'];
  priority: Database['public']['Tables']['tasks']['Row']['priority'];
  position: number;
  labels: string[];
  estimated_hours?: number;
};

export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: TaskTemplate[];
};

export const PROJECT_TEMPLATES: BoardTemplate[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Comprehensive template for modern web development with HTML, CSS, and JavaScript',
    icon: '🌐',
    tasks: [
      // Project Setup & Planning
      {
        title: '1. Project Setup & Repository',
        description: '• Initialize Git repository\n• Set up project structure\n• Configure package.json\n• Set up build tools (Vite/Webpack)\n• Configure ESLint and Prettier\n• Set up CI/CD pipeline',
        status: 'todo',
        priority: 'high',
        position: 10000,
        labels: ['setup', 'devops'],
        estimated_hours: 4
      },
      {
        title: '2. Design System & Assets',
        description: '• Create color palette and typography system\n• Design component library structure\n• Set up CSS architecture (BEM/SCSS)\n• Create design tokens\n• Prepare responsive breakpoints\n• Set up icon system',
        status: 'todo',
        priority: 'high',
        position: 20000,
        labels: ['design', 'ui'],
        estimated_hours: 6
      },
      // HTML Structure
      {
        title: '3. HTML Foundation',
        description: '• Create semantic HTML structure\n• Implement SEO meta tags\n• Set up Open Graph tags\n• Configure robots.txt and sitemap\n• Implement schema markup\n• Set up accessibility attributes',
        status: 'todo',
        priority: 'high',
        position: 30000,
        labels: ['html', 'seo'],
        estimated_hours: 4
      },
      {
        title: '4. Responsive Layout',
        description: '• Implement mobile-first grid system\n• Create flexible layouts with CSS Grid\n• Set up responsive navigation\n• Implement responsive images\n• Create fluid typography system',
        status: 'todo',
        priority: 'high',
        position: 40000,
        labels: ['css', 'responsive'],
        estimated_hours: 8
      },
      // CSS Implementation
      {
        title: '5. Core CSS Components',
        description: '• Build button system with states\n• Create form elements and inputs\n• Implement card components\n• Build modal/dialog system\n• Create loading states and animations\n• Implement toast notifications',
        status: 'todo',
        priority: 'high',
        position: 50000,
        labels: ['css', 'components'],
        estimated_hours: 12
      },
      {
        title: '6. Advanced CSS Features',
        description: '• Implement CSS animations and transitions\n• Create custom properties system\n• Build dark mode support\n• Implement CSS custom properties\n• Create advanced hover effects\n• Build skeleton loading states',
        status: 'todo',
        priority: 'medium',
        position: 60000,
        labels: ['css', 'advanced'],
        estimated_hours: 8
      },
      // JavaScript Functionality
      {
        title: '7. Core JavaScript Features',
        description: '• Implement DOM manipulation utilities\n• Create event handling system\n• Build form validation\n• Implement data persistence\n• Create state management system\n• Build routing system',
        status: 'todo',
        priority: 'high',
        position: 70000,
        labels: ['javascript', 'core'],
        estimated_hours: 16
      },
      {
        title: '8. Advanced Interactions',
        description: '• Implement infinite scroll\n• Create drag and drop functionality\n• Build lazy loading system\n• Implement virtual scrolling\n• Create advanced animations\n• Build gesture controls',
        status: 'todo',
        priority: 'medium',
        position: 80000,
        labels: ['javascript', 'interactions'],
        estimated_hours: 12
      },
      // Performance & Optimization
      {
        title: '9. Performance Optimization',
        description: '• Implement code splitting\n• Optimize asset loading\n• Set up caching strategy\n• Implement service workers\n• Create offline support\n• Optimize Core Web Vitals',
        status: 'todo',
        priority: 'high',
        position: 90000,
        labels: ['performance', 'optimization'],
        estimated_hours: 8
      },
      {
        title: '10. Testing & Quality',
        description: '• Set up unit testing (Jest)\n• Implement E2E tests (Cypress)\n• Create visual regression tests\n• Set up performance monitoring\n• Implement error tracking\n• Create test documentation',
        status: 'todo',
        priority: 'medium',
        position: 100000,
        labels: ['testing', 'quality'],
        estimated_hours: 10
      },
      // Documentation & Deployment
      {
        title: '11. Documentation',
        description: '• Create component documentation\n• Write API documentation\n• Document build process\n• Create style guide\n• Write contribution guidelines\n• Document testing procedures',
        status: 'todo',
        priority: 'medium',
        position: 110000,
        labels: ['documentation'],
        estimated_hours: 6
      },
      {
        title: '12. Production Deployment',
        description: '• Configure production build\n• Set up CDN\n• Implement security headers\n• Configure SSL/TLS\n• Set up monitoring\n• Create deployment documentation',
        status: 'todo',
        priority: 'high',
        position: 120000,
        labels: ['deployment', 'devops'],
        estimated_hours: 6
      }
    ]
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Comprehensive template for planning and executing sophisticated marketing campaigns with advanced analytics, multi-channel strategy, and performance optimization',
    icon: '📢',
    tasks: [
      // Research & Strategy Phase
      {
        title: '1. Market Research & Analysis',
        description: '• Conduct comprehensive market analysis\n• Research competitor strategies and positioning\n• Analyze industry trends and opportunities\n• Identify market gaps and potential\n• Study successful case studies\n• Create SWOT analysis\n• Document market size and segments',
        status: 'todo',
        priority: 'high',
        position: 10000,
        labels: ['research', 'strategy'],
        estimated_hours: 16
      },
      {
        title: '2. Target Audience Definition',
        description: '• Create detailed buyer personas\n• Conduct demographic research\n• Map customer journey stages\n• Analyze customer pain points\n• Document buying behaviors\n• Identify key decision makers\n• Research audience online habits\n• Create audience segmentation strategy',
        status: 'todo',
        priority: 'high',
        position: 20000,
        labels: ['research', 'audience'],
        estimated_hours: 12
      },
      {
        title: '3. Campaign Strategy Development',
        description: '• Define campaign objectives and KPIs\n• Set SMART goals\n• Develop unique value proposition\n• Create campaign messaging framework\n• Define brand voice and tone\n• Establish campaign timeline\n• Set budget allocation strategy\n• Define success metrics',
        status: 'todo',
        priority: 'high',
        position: 30000,
        labels: ['strategy', 'planning'],
        estimated_hours: 10
      },
      // Content & Creative Phase
      {
        title: '4. Content Strategy & Planning',
        description: '• Develop content pillars\n• Create editorial guidelines\n• Plan content themes and topics\n• Define content types and formats\n• Create content calendar\n• Assign content creators\n• Set up content approval workflow\n• Plan content distribution strategy',
        status: 'todo',
        priority: 'high',
        position: 40000,
        labels: ['content', 'planning'],
        estimated_hours: 14
      },
      {
        title: '5. Creative Asset Development',
        description: '• Design campaign visual identity\n• Create brand style guide\n• Design social media templates\n• Develop email templates\n• Create landing page designs\n• Design advertising banners\n• Produce video content\n• Create infographics and visuals',
        status: 'todo',
        priority: 'high',
        position: 50000,
        labels: ['design', 'creative'],
        estimated_hours: 20
      },
      {
        title: '6. Copy & Messaging Creation',
        description: '• Write campaign headlines\n• Develop key messages\n• Create email copy sequences\n• Write social media content\n• Develop ad copy variations\n• Create landing page copy\n• Write blog posts and articles\n• Develop sales enablement content',
        status: 'todo',
        priority: 'high',
        position: 60000,
        labels: ['copywriting', 'content'],
        estimated_hours: 16
      },
      // Channel Setup & Implementation
      {
        title: '7. Digital Channel Setup',
        description: '• Configure email marketing platform\n• Set up social media scheduling tools\n• Configure ad platforms\n• Set up landing pages\n• Install tracking pixels\n• Configure marketing automation\n• Set up CRM integrations\n• Configure lead scoring system',
        status: 'todo',
        priority: 'high',
        position: 70000,
        labels: ['setup', 'technical'],
        estimated_hours: 12
      },
      {
        title: '8. Paid Media Strategy',
        description: '• Develop paid media plan\n• Set up ad accounts\n• Create audience targeting segments\n• Develop bidding strategy\n• Create A/B testing plan\n• Set up conversion tracking\n• Create remarketing audiences\n• Develop budget pacing strategy',
        status: 'todo',
        priority: 'high',
        position: 80000,
        labels: ['advertising', 'paid-media'],
        estimated_hours: 10
      },
      {
        title: '9. Marketing Automation Setup',
        description: '• Design automation workflows\n• Set up email sequences\n• Create lead nurturing paths\n• Configure trigger events\n• Set up personalization rules\n• Create dynamic content rules\n• Configure lead scoring\n• Set up integration webhooks',
        status: 'todo',
        priority: 'medium',
        position: 90000,
        labels: ['automation', 'technical'],
        estimated_hours: 16
      },
      // Testing & Optimization
      {
        title: '10. Pre-Launch Testing',
        description: '• Test all automation workflows\n• Verify tracking setup\n• Test email deliverability\n• Check mobile responsiveness\n• Test form submissions\n• Verify integration functions\n• Conduct UAT testing\n• Check compliance requirements',
        status: 'todo',
        priority: 'high',
        position: 100000,
        labels: ['testing', 'quality'],
        estimated_hours: 8
      },
      {
        title: '11. Analytics & Tracking Setup',
        description: '• Set up conversion tracking\n• Configure custom reports\n• Set up attribution modeling\n• Create dashboard views\n• Configure goal tracking\n• Set up custom dimensions\n• Create automated reports\n• Configure alert systems',
        status: 'todo',
        priority: 'high',
        position: 110000,
        labels: ['analytics', 'tracking'],
        estimated_hours: 10
      },
      // Launch & Optimization
      {
        title: '12. Campaign Launch',
        description: '• Execute soft launch\n• Monitor initial performance\n• Deploy paid campaigns\n• Activate automation flows\n• Begin content distribution\n• Launch email sequences\n• Start social media posting\n• Begin PR activities',
        status: 'todo',
        priority: 'high',
        position: 120000,
        labels: ['launch', 'execution'],
        estimated_hours: 8
      },
      {
        title: '13. Performance Monitoring',
        description: '• Monitor KPI performance\n• Track conversion rates\n• Analyze user behavior\n• Monitor engagement metrics\n• Track ROI by channel\n• Analyze customer feedback\n• Monitor competitive activity\n• Track brand mentions',
        status: 'todo',
        priority: 'high',
        position: 130000,
        labels: ['monitoring', 'analytics'],
        estimated_hours: 6
      },
      {
        title: '14. Optimization & Scaling',
        description: '• Analyze performance data\n• Optimize targeting settings\n• Refine ad creative\n• Adjust budget allocation\n• Optimize landing pages\n• Improve email sequences\n• Scale successful channels\n• Document learnings',
        status: 'todo',
        priority: 'medium',
        position: 140000,
        labels: ['optimization', 'scaling'],
        estimated_hours: 12
      },
      // Documentation & Reporting
      {
        title: '15. Campaign Documentation',
        description: '• Document campaign strategy\n• Create process documentation\n• Record optimization history\n• Document technical setup\n• Create training materials\n• Document best practices\n• Create templates for future use\n• Archive creative assets',
        status: 'todo',
        priority: 'medium',
        position: 150000,
        labels: ['documentation'],
        estimated_hours: 8
      },
      {
        title: '16. Final Reporting & Analysis',
        description: '• Create comprehensive report\n• Calculate final ROI\n• Document key learnings\n• Create case study\n• Present results to stakeholders\n• Document recommendations\n• Create future strategy plan\n• Archive campaign assets',
        status: 'todo',
        priority: 'high',
        position: 160000,
        labels: ['reporting', 'analysis'],
        estimated_hours: 10
      }
    ]
  },
  {
    id: 'product-design',
    name: 'Product Design',
    description: 'Advanced end-to-end product design workflow covering research, UX/UI design, prototyping, testing, and design systems with modern best practices',
    icon: '🎨',
    tasks: [
      // Discovery & Research Phase
      {
        title: '1. Project Discovery & Planning',
        description: '• Define project goals and objectives\n• Create project timeline and milestones\n• Identify key stakeholders\n• Document technical constraints\n• Define success metrics\n• Set up design tools and workspace\n• Create research plan\n• Schedule stakeholder interviews',
        status: 'todo',
        priority: 'high',
        position: 10000,
        labels: ['planning', 'strategy'],
        estimated_hours: 8
      },
      {
        title: '2. User Research',
        description: '• Conduct stakeholder interviews\n• Perform competitive analysis\n• Create user surveys\n• Conduct user interviews\n• Analyze existing analytics\n• Create user personas\n• Document user pain points\n• Map current user journeys',
        status: 'todo',
        priority: 'high',
        position: 20000,
        labels: ['research', 'ux'],
        estimated_hours: 16
      },
      {
        title: '3. Research Synthesis',
        description: '• Analyze research findings\n• Create affinity diagrams\n• Identify key insights\n• Document user needs\n• Create jobs-to-be-done framework\n• Define user scenarios\n• Map opportunity areas\n• Present research findings',
        status: 'todo',
        priority: 'high',
        position: 30000,
        labels: ['research', 'analysis'],
        estimated_hours: 12
      },
      // UX Design Phase
      {
        title: '4. Information Architecture',
        description: '• Create site map\n• Design navigation structure\n• Develop content hierarchy\n• Create user flows\n• Design interaction models\n• Document taxonomies\n• Create content matrix\n• Define naming conventions',
        status: 'todo',
        priority: 'high',
        position: 40000,
        labels: ['ux', 'architecture'],
        estimated_hours: 10
      },
      {
        title: '5. User Flow Design',
        description: '• Map ideal user journeys\n• Create task flows\n• Design interaction flows\n• Document edge cases\n• Create state diagrams\n• Define error states\n• Map micro-interactions\n• Document flow logic',
        status: 'todo',
        priority: 'high',
        position: 50000,
        labels: ['ux', 'flows'],
        estimated_hours: 12
      },
      {
        title: '6. Wireframing',
        description: '• Create low-fidelity wireframes\n• Design content layouts\n• Map component placement\n• Create responsive grids\n• Design navigation patterns\n• Document layout systems\n• Create wireflow diagrams\n• Design form structures',
        status: 'todo',
        priority: 'high',
        position: 60000,
        labels: ['ux', 'wireframes'],
        estimated_hours: 16
      },
      // Visual Design Phase
      {
        title: '7. Design System Planning',
        description: '• Audit existing design patterns\n• Define design principles\n• Create color system\n• Design typography scale\n• Define spacing system\n• Create grid system\n• Document design tokens\n• Plan component library',
        status: 'todo',
        priority: 'high',
        position: 70000,
        labels: ['design-system', 'planning'],
        estimated_hours: 14
      },
      {
        title: '8. Core Components Design',
        description: '• Design buttons and inputs\n• Create form components\n• Design navigation elements\n• Create card patterns\n• Design modal systems\n• Create loading states\n• Design notification system\n• Document component usage',
        status: 'todo',
        priority: 'high',
        position: 80000,
        labels: ['ui', 'components'],
        estimated_hours: 20
      },
      {
        title: '9. Visual Design',
        description: '• Create mood boards\n• Design visual style\n• Apply brand guidelines\n• Create high-fidelity mockups\n• Design micro-interactions\n• Create animation specs\n• Design dark mode variants\n• Document visual rules',
        status: 'todo',
        priority: 'high',
        position: 90000,
        labels: ['ui', 'visual'],
        estimated_hours: 24
      },
      // Prototyping & Testing
      {
        title: '10. Interactive Prototyping',
        description: '• Create clickable prototypes\n• Design interaction animations\n• Build transition flows\n• Create micro-interaction demos\n• Design gesture interactions\n• Build responsive prototypes\n• Create prototype documentation\n• Set up testing scenarios',
        status: 'todo',
        priority: 'high',
        position: 100000,
        labels: ['prototyping', 'interaction'],
        estimated_hours: 16
      },
      {
        title: '11. Usability Testing',
        description: '• Create test plan\n• Write test scripts\n• Recruit test participants\n• Conduct usability tests\n• Record testing sessions\n• Take observation notes\n• Document user feedback\n• Analyze test results',
        status: 'todo',
        priority: 'high',
        position: 110000,
        labels: ['testing', 'research'],
        estimated_hours: 20
      },
      {
        title: '12. Design Iterations',
        description: '• Analyze testing feedback\n• Identify improvement areas\n• Prioritize changes\n• Update design files\n• Refine interactions\n• Improve accessibility\n• Update prototypes\n• Document iterations',
        status: 'todo',
        priority: 'high',
        position: 120000,
        labels: ['iteration', 'refinement'],
        estimated_hours: 16
      },
      // Design System & Documentation
      {
        title: '13. Design System Development',
        description: '• Create component library\n• Document usage guidelines\n• Define component props\n• Create pattern library\n• Document accessibility rules\n• Create icon system\n• Build style guide\n• Set up version control',
        status: 'todo',
        priority: 'high',
        position: 130000,
        labels: ['design-system', 'documentation'],
        estimated_hours: 24
      },
      {
        title: '14. Design QA',
        description: '• Check responsive layouts\n• Verify component states\n• Test accessibility compliance\n• Check design consistency\n• Validate interaction patterns\n• Test cross-platform compatibility\n• Verify design specs\n• Document QA results',
        status: 'todo',
        priority: 'high',
        position: 140000,
        labels: ['qa', 'testing'],
        estimated_hours: 12
      },
      // Handoff & Implementation
      {
        title: '15. Developer Handoff',
        description: '• Prepare design specs\n• Create asset exports\n• Document interactions\n• Write implementation notes\n• Create animation specs\n• Document responsive rules\n• Prepare style guide\n• Set up collaboration workflow',
        status: 'todo',
        priority: 'high',
        position: 150000,
        labels: ['handoff', 'documentation'],
        estimated_hours: 12
      },
      {
        title: '16. Design Implementation Support',
        description: '• Review development progress\n• Provide implementation feedback\n• Address design questions\n• Create additional assets\n• Update design documentation\n• Support edge cases\n• Monitor implementation quality\n• Document design decisions',
        status: 'todo',
        priority: 'medium',
        position: 160000,
        labels: ['support', 'implementation'],
        estimated_hours: 16
      }
    ]
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Advanced end-to-end product launch framework covering market analysis, go-to-market strategy, beta testing, marketing, sales enablement, and launch execution with comprehensive post-launch analysis',
    icon: '🚀',
    tasks: [
      // Research & Strategy Phase
      {
        title: '1. Market & Competitive Analysis',
        description: '• Conduct comprehensive market research\n• Analyze competitor products and strategies\n• Identify market gaps and opportunities\n• Assess market size and segments\n• Study customer needs and preferences\n• Analyze pricing strategies\n• Evaluate distribution channels\n• Create competitive positioning matrix',
        status: 'todo',
        priority: 'high',
        position: 10000,
        labels: ['research', 'strategy'],
        estimated_hours: 20
      },
      {
        title: '2. Product Launch Strategy',
        description: '• Define launch goals and objectives\n• Create product positioning strategy\n• Develop value proposition\n• Define target market segments\n• Set pricing strategy\n• Plan distribution strategy\n• Create launch timeline\n• Define success metrics',
        status: 'todo',
        priority: 'high',
        position: 20000,
        labels: ['strategy', 'planning'],
        estimated_hours: 16
      },
      {
        title: '3. Launch Budget & Resources',
        description: '• Create detailed launch budget\n• Allocate resources by department\n• Define team roles and responsibilities\n• Identify resource gaps\n• Plan contingency budget\n• Create staffing plan\n• Set up tracking systems\n• Define approval processes',
        status: 'todo',
        priority: 'high',
        position: 30000,
        labels: ['budget', 'planning'],
        estimated_hours: 12
      },
      // Product Readiness
      {
        title: '4. Product Development Alignment',
        description: '• Review product roadmap\n• Verify feature completeness\n• Check technical requirements\n• Assess scalability readiness\n• Review security compliance\n• Verify integration readiness\n• Check platform compatibility\n• Document technical specifications',
        status: 'todo',
        priority: 'high',
        position: 40000,
        labels: ['product', 'technical'],
        estimated_hours: 16
      },
      {
        title: '5. Beta Testing Program',
        description: '• Design beta testing strategy\n• Create participant selection criteria\n• Develop testing protocols\n• Set up feedback collection systems\n• Create beta communication plan\n• Monitor beta usage metrics\n• Collect and analyze feedback\n• Document beta findings',
        status: 'todo',
        priority: 'high',
        position: 50000,
        labels: ['testing', 'feedback'],
        estimated_hours: 24
      },
      {
        title: '6. Product Documentation',
        description: '• Create user documentation\n• Write technical documentation\n• Develop API documentation\n• Create onboarding guides\n• Write troubleshooting guides\n• Create FAQ documents\n• Prepare support documentation\n• Design help center content',
        status: 'todo',
        priority: 'high',
        position: 60000,
        labels: ['documentation', 'support'],
        estimated_hours: 20
      },
      // Marketing Preparation
      {
        title: '7. Marketing Assets Development',
        description: '• Create brand messaging guide\n• Design marketing collateral\n• Develop sales presentations\n• Create product videos\n• Design social media assets\n• Prepare email templates\n• Create website content\n• Design advertising materials',
        status: 'todo',
        priority: 'high',
        position: 70000,
        labels: ['marketing', 'creative'],
        estimated_hours: 30
      },
      {
        title: '8. PR & Communications Plan',
        description: '• Develop PR strategy\n• Create press kit materials\n• Write press releases\n• Plan media outreach\n• Create communication timeline\n• Prepare spokesperson briefings\n• Plan launch events\n• Create crisis communication plan',
        status: 'todo',
        priority: 'high',
        position: 80000,
        labels: ['pr', 'communications'],
        estimated_hours: 16
      },
      {
        title: '9. Digital Marketing Setup',
        description: '• Set up marketing automation\n• Configure analytics tracking\n• Create advertising campaigns\n• Set up email sequences\n• Configure landing pages\n• Set up social media campaigns\n• Create content calendar\n• Configure conversion tracking',
        status: 'todo',
        priority: 'high',
        position: 90000,
        labels: ['digital-marketing', 'setup'],
        estimated_hours: 20
      },
      // Sales & Support Readiness
      {
        title: '10. Sales Enablement',
        description: '• Create sales playbook\n• Develop pricing guides\n• Create competitor battle cards\n• Design sales presentations\n• Develop ROI calculators\n• Create proposal templates\n• Plan sales incentives\n• Design sales training program',
        status: 'todo',
        priority: 'high',
        position: 100000,
        labels: ['sales', 'enablement'],
        estimated_hours: 24
      },
      {
        title: '11. Support Team Preparation',
        description: '• Create support processes\n• Set up ticketing system\n• Develop support scripts\n• Create escalation procedures\n• Train support team\n• Set up monitoring tools\n• Create SLA guidelines\n• Prepare support metrics',
        status: 'todo',
        priority: 'high',
        position: 110000,
        labels: ['support', 'training'],
        estimated_hours: 16
      },
      {
        title: '12. Customer Success Planning',
        description: '• Create onboarding process\n• Design success metrics\n• Develop engagement strategy\n• Create feedback loops\n• Design retention programs\n• Create customer journey maps\n• Plan success team structure\n• Design reporting templates',
        status: 'todo',
        priority: 'high',
        position: 120000,
        labels: ['customer-success', 'planning'],
        estimated_hours: 16
      },
      // Launch Execution
      {
        title: '13. Pre-Launch Verification',
        description: '• Conduct final testing\n• Verify system readiness\n• Check marketing assets\n• Test customer journeys\n• Verify integrations\n• Check analytics setup\n• Review legal compliance\n• Conduct security audit',
        status: 'todo',
        priority: 'high',
        position: 130000,
        labels: ['verification', 'quality'],
        estimated_hours: 12
      },
      {
        title: '14. Launch Execution',
        description: '• Execute soft launch\n• Activate marketing campaigns\n• Release press announcements\n• Launch sales programs\n• Activate support systems\n• Monitor system performance\n• Track initial metrics\n• Manage launch communications',
        status: 'todo',
        priority: 'high',
        position: 140000,
        labels: ['launch', 'execution'],
        estimated_hours: 8
      },
      // Post-Launch Activities
      {
        title: '15. Post-Launch Monitoring',
        description: '• Monitor product performance\n• Track user adoption\n• Analyze customer feedback\n• Monitor support tickets\n• Track sales pipeline\n• Analyze marketing metrics\n• Monitor social mentions\n• Track competitive responses',
        status: 'todo',
        priority: 'high',
        position: 150000,
        labels: ['monitoring', 'analysis'],
        estimated_hours: 12
      },
      {
        title: '16. Launch Analysis & Optimization',
        description: '• Analyze launch metrics\n• Create performance reports\n• Document lessons learned\n• Plan optimization strategy\n• Update product roadmap\n• Adjust marketing strategy\n• Optimize sales process\n• Plan next phase activities',
        status: 'todo',
        priority: 'high',
        position: 160000,
        labels: ['analysis', 'optimization'],
        estimated_hours: 16
      }
    ]
  },
  {
    id: 'finance-management',
    name: 'Finance Management',
    description: 'Comprehensive template for managing personal or business finances, budgeting, investments, and financial planning',
    icon: '💰',
    tasks: [
      {
        title: '1. Budget Planning',
        description: '• Create monthly budget\n• Set financial goals\n• Track income sources\n• Plan expense categories\n• Set savings targets\n• Review fixed costs\n• Plan investments\n• Create emergency fund',
        status: 'todo',
        priority: 'high',
        position: 10000,
        labels: ['planning', 'finance'],
        estimated_hours: 4
      },
      {
        title: '2. Expense Tracking',
        description: '• Set up expense categories\n• Track daily expenses\n• Monitor recurring bills\n• Review subscriptions\n• Track business expenses\n• Monitor cash flow\n• Analyze spending patterns\n• Create expense reports',
        status: 'todo',
        priority: 'high',
        position: 20000,
        labels: ['tracking', 'expenses'],
        estimated_hours: 2
      },
      {
        title: '3. Investment Management',
        description: '• Review investment portfolio\n• Research investment options\n• Track stock performance\n• Monitor market trends\n• Review retirement accounts\n• Plan asset allocation\n• Evaluate risk tolerance\n• Set investment goals',
        status: 'todo',
        priority: 'high',
        position: 30000,
        labels: ['investments', 'planning'],
        estimated_hours: 6
      },
      {
        title: '4. Tax Planning',
        description: '• Organize tax documents\n• Track deductions\n• Plan tax payments\n• Review tax obligations\n• Schedule tax deadlines\n• Consult tax advisor\n• Prepare tax records\n• Plan tax strategy',
        status: 'todo',
        priority: 'medium',
        position: 40000,
        labels: ['taxes', 'planning'],
        estimated_hours: 4
      }
    ]
  },
  {
    id: 'personal-tasks',
    name: 'Personal Tasks',
    description: 'Organized template for managing personal goals, daily tasks, and life management with focus on productivity and well-being',
    icon: '✨',
    tasks: [
      {
        title: '1. Daily Routines',
        description: '• Morning routine checklist\n• Exercise schedule\n• Meal planning\n• Work tasks\n• Evening routine\n• Self-care activities\n• Reading goals\n• Habit tracking',
        status: 'todo',
        priority: 'high',
        position: 10000,
        labels: ['routine', 'personal'],
        estimated_hours: 1
      },
      {
        title: '2. Personal Projects',
        description: '• Home improvement tasks\n• Learning goals\n• Hobby projects\n• Creative activities\n• Side projects\n• Skill development\n• Personal writing\n• DIY projects',
        status: 'todo',
        priority: 'medium',
        position: 20000,
        labels: ['projects', 'personal'],
        estimated_hours: 8
      },
      {
        title: '3. Life Admin',
        description: '• Appointments scheduling\n• Bill payments\n• Home maintenance\n• Document organization\n• Insurance review\n• Vehicle maintenance\n• Health checkups\n• Important contacts',
        status: 'todo',
        priority: 'high',
        position: 30000,
        labels: ['admin', 'organization'],
        estimated_hours: 4
      },
      {
        title: '4. Social & Events',
        description: '• Event planning\n• Birthday reminders\n• Social commitments\n• Family activities\n• Friend meetups\n• Special occasions\n• Travel planning\n• Gift shopping',
        status: 'todo',
        priority: 'medium',
        position: 40000,
        labels: ['social', 'events'],
        estimated_hours: 3
      }
    ]
  }
]; 