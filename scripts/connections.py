"""Personal connections used by the card interaction, grounded in the essays."""

CONNECTIONS = {
 'ai-governance': (('AI', 'Accountability', 'Corporate law'), 'The forum shifted my attention from what AI can do to who remains responsible.'),
 'agentic-commerce': (('AI agents', 'Permission', 'Commerce'), 'An agent can act. My question is how a business knows it has permission.'),
 'human-cities': (('Places', 'People', 'Purpose'), 'A development becomes meaningful through the people who use it.'),
 'commercial-design': (('Design', 'People', 'Value'), 'I am interested in how a design choice makes innovation useful to someone.'),
 'innovation': (('Demonstration', 'Reliability', 'Adoption'), 'An impressive demonstration made me ask what it takes to depend on a product.'),
 'resilience': (('Setbacks', 'Reflection', 'Progress'), 'I want to use a setback to change my approach, then try again with better understanding.'),
 'personalised-learning': (('Tools', 'Practice', 'Understanding'), 'A clear explanation helps me begin; practice tells me whether I understand.'),
}
for event, essay in [('unesco', 'ai-governance'), ('money2020', 'agentic-commerce'), ('leap', 'innovation')]:
 CONNECTIONS[event] = CONNECTIONS[essay]
