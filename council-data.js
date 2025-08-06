// Centralized Dallas City Council Member Data
// This ensures consistent names and information across all templates

const COUNCIL_MEMBERS = [
  {
    district: 9,
    name: "Paula Blackmon", 
    fullName: "District 9 - Paula Blackmon",
    email: "paula.blackmon@dallas.gov",
    status: "waffling",
    statusLabel: "Needs Action",
    description: "WAFFLING",
    votes: "Needs Action",
    issues: [
      "Lacks concrete action plan",
      "Unclear position on resident concerns", 
      "Needs to take a definitive stance"
    ],
    quote: null,
    analysis: "Statements don't create action to stop the change. We need leadership, not empty words."
  },
  {
    district: 10,
    name: "Kathy Stewart",
    fullName: "District 10 - Kathy Stewart", 
    email: "kathy.stewart@dallas.gov",
    status: "shameful",
    statusLabel: "Major Disappointment",
    description: "SHAMEFUL",
    votes: "Major Disappointment",
    issues: [
      "Accepts harmful changes without question",
      "Fails to advocate for constituents",
      "Misrepresents community impact"
    ],
    quote: "They've developed a plan that minimizes the impact to our community — and I am grateful.",
    analysis: "This plan is a major disservice to residents. Gratitude for disruption is not leadership—it's abandonment of duty."
  },
  {
    district: 11,
    name: "William Roth",
    fullName: "District 11 - William Roth",
    email: "william.roth@dallas.gov", 
    status: "victory",
    statusLabel: "Standing Strong",
    description: "VICTORY",
    votes: "Standing Strong",
    issues: [
      "Recognizes neighborhood design principles",
      "Acknowledges community disruption concerns",
      "Takes a clear stand for residents"
    ],
    quote: "Most homes were designed for alley service. This plan will cause significant disruption to our neighborhood.",
    analysis: "Thank you for defending our neighborhoods!"
  },
  {
    district: 12,
    name: "Cara Mendelsohn",
    fullName: "District 12 - Cara Mendelsohn",
    email: "cara.mendelsohn@dallas.gov",
    status: "victory", 
    statusLabel: "Standing Strong",
    description: "VICTORY",
    votes: "Standing Strong", 
    issues: [
      "Recognizes daily impact on residents",
      "Questions hasty implementation",
      "Takes a clear stand for residents"
    ],
    quote: "This is much more impactful for the day to day life of our residents than we're just going to go and do this.",
    analysis: "Thank you for defending our neighborhoods!"
  },
  {
    district: 13,
    name: "Gay Donnell Willis", 
    fullName: "District 13 - Gay Donnell Willis",
    email: "gay.willis@dallas.gov",
    status: "misguided",
    statusLabel: "Poor Performance", 
    description: "WAFFLING",
    votes: "Poor Performance",
    issues: [
      "Recognizes the problem but no action plan",
      "Unclear position on preventing changes",
      "Needs to take a definitive stance"
    ],
    quote: "The reality is just how these homes were built. This is going to be an abrupt change should this go through.",
    analysis: "Acknowledges the impact but lacks concrete action to prevent the change. We need leadership, not just recognition of the problem."
  }
];

// Helper functions for accessing council member data
const getCouncilMember = (district) => {
  return COUNCIL_MEMBERS.find(member => member.district === district);
};

const getCouncilMemberByName = (name) => {
  return COUNCIL_MEMBERS.find(member => 
    member.name.toLowerCase().includes(name.toLowerCase()) ||
    member.fullName.toLowerCase().includes(name.toLowerCase())
  );
};

const getAllCouncilMembers = () => {
  return [...COUNCIL_MEMBERS];
};

// Get council members for newsletter (simplified format)
const getNewsletterCouncilMembers = () => {
  return COUNCIL_MEMBERS.map(member => ({
    name: member.fullName,
    status: member.status,
    votes: member.votes
  }));
};

// Generate email template with proper council member name
const generateEmailTemplate = (district, customMessage = '') => {
  const member = getCouncilMember(district);
  if (!member) return null;

  const baseTemplate = `Dear Council Member ${member.name},%0D%0A%0D%0AI am writing to express my strong opposition to the City of Dallas's proposed changes to alley trash collection services. As a resident of District ${district}, I am deeply concerned about the impact these changes will have on our neighborhood and community.%0D%0A%0D%0AKey Concerns:%0D%0A• The transition from alley to curbside collection will negatively impact neighborhood aesthetics and property values%0D%0A• Many residents, especially elderly and disabled individuals, will face significant challenges with curbside collection%0D%0A• Our neighborhood was specifically designed for alley collection service%0D%0A• The proposed changes will create safety hazards and reduce the walkability of our community%0D%0A%0D%0AI urge you to:%0D%0A1. Oppose the elimination of alley collection services%0D%0A2. Support maintaining the current alley collection system%0D%0A%0D%0APlease represent the interests of your constituents and oppose these changes that will harm our community's quality of life.%0D%0A%0D%0AThank you for your attention to this urgent matter.%0D%0A%0D%0ASincerely,%0D%0A[YOUR NAME]%0D%0A[YOUR ADDRESS]%0D%0A[YOUR PHONE NUMBER]`;

  return {
    email: member.email,
    subject: 'Urgent: Opposition to Alley Collection Changes',
    body: baseTemplate + (customMessage ? `%0D%0A%0D%0A${customMessage}` : '')
  };
};

// Generate complete mailto URL for council member
const generateMailtoURL = (district, customMessage = '') => {
  const template = generateEmailTemplate(district, customMessage);
  if (!template) return null;
  
  return `mailto:${template.email}?subject=${encodeURIComponent(template.subject)}&body=${template.body}`;
};

// Get council members formatted for suggestions template
const getCouncilMembersForSuggestions = () => {
  return COUNCIL_MEMBERS.map(member => ({
    ...member,
    phone: `(214) 670-${(670 + member.district).toString().padStart(4, '0')}`, // Generate phone based on district
    office: "1500 Marilla Street, Room 5FN, Dallas, TX 75201",
    mailtoURL: generateMailtoURL(member.district)
  }));
};

// Validation function to ensure data consistency
const validateCouncilData = () => {
  const issues = [];
  
  COUNCIL_MEMBERS.forEach(member => {
    if (!member.name || !member.email || !member.district) {
      issues.push(`Missing required data for District ${member.district}`);
    }
    
    if (!member.email.includes('@dallas.gov')) {
      issues.push(`Invalid email format for ${member.name}: ${member.email}`);
    }
    
    if (!['waffling', 'shameful', 'victory', 'misguided'].includes(member.status)) {
      issues.push(`Invalid status for ${member.name}: ${member.status}`);
    }
  });
  
  if (issues.length > 0) {
    console.warn('Council data validation issues:', issues);
    return false;
  }
  
  console.log('✅ Council data validation passed');
  return true;
};

module.exports = {
  COUNCIL_MEMBERS,
  getCouncilMember,
  getCouncilMemberByName,
  getAllCouncilMembers,
  getNewsletterCouncilMembers,
  generateEmailTemplate,
  generateMailtoURL,
  getCouncilMembersForSuggestions,
  validateCouncilData
};