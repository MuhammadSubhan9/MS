"""Build this original, dependency-free portfolio from its authored content."""
from pathlib import Path
from html import escape
import json, re, math

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'dist'
PROFILE='https://www.linkedin.com/in/ms910/'
ORIGIN='https://muhammadsubhan.pages.dev'
PAGES={}
def E(s):return escape(str(s),quote=True)
def add(path,title,category,description,sections=None,**kw):
 PAGES[path]={'path':path,'title':title,'category':category,'description':description,'sections':sections or [],**kw}
def sec(title,*paragraphs):return {'title':title,'paragraphs':list(paragraphs)}
def slug(s):return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def link(path,text,cls='text-link'):return f'<a class="{cls}" href="{E(path)}">{E(text)}</a>'
def card(p,prefix=''):
 return f'<a class="card reveal" href="{prefix}{E(p["path"])}" data-category="{E(p.get("tags",p["category"]).lower())}"><span class="eyebrow">{E(p.get("label",p["category"]))}</span><h3>{E(p["title"])}</h3><p>{E(p["description"])}</p><span class="card-bottom"><span>{E(p.get("date","Explore the chapter"))}</span><span>Read more</span></span></a>'

add('about.html','A person before a profession.','About','A student in Riyadh, drawn to the places where business, technology, and responsibility meet.',[
 sec('The person behind the portfolio',
 'My name is Muhammad Subhan. I am a Pakistani student living in Riyadh, Saudi Arabia, currently studying International A Levels at Al-Rowad International Schools. I have completed my IGCSEs and am studying Mathematics, Physics, and Computer Science. My present academic work is the foundation for what I hope to do next: pursue a career in corporate and commercial law.',
 'The thread connecting my interests is a desire to understand what sits behind the visible result. An airport looks orderly until you start asking about the teams and decisions that keep it running. An AI demonstration looks impressive until you ask who is responsible when something goes wrong. A business announcement becomes more interesting when you ask how the company will turn an idea into a useful product.'),
 sec('How my interests have evolved',
 'Aviation was an important early direction for me. Courses in crew management, aviation management, and aircraft design gave that curiosity a structure. Industry events brought another dimension: hearing people talk about operations, coordination, and technology made it easier to see how many disciplines contribute to one outcome.',
 'My current direction is corporate law, particularly mergers and acquisitions and private equity. That change does not erase the earlier learning. It gives me a different way to connect it. I am increasingly interested in how organisations make decisions, how people allocate responsibility, and how commercial ambitions interact with the rules and systems around them.'),
 sec('Learning beyond the classroom',
 'My LinkedIn record includes courses across business and aviation, student volunteering, and reflections from events in Riyadh. At Black Hat MEA I explored cybersecurity. At Money20/20 I found myself asking about identity, authorisation, and the infrastructure behind AI-enabled commerce. At the UNESCO forum, the conversation shifted from technical capability to governance and accountability.',
 'I also enjoy expressing what I notice through writing. A useful reflection should do more than say that an event was interesting. It should explain what changed my understanding, identify a question worth pursuing, and distinguish an observation from a conclusion. The journal in this portfolio develops that habit.'),
 sec('Values beyond a career title','My LinkedIn profile lists Education, Science and Technology, Human Rights, Economic Empowerment, Environment, and Animal Welfare among the causes I care about. These are interests and values in my profile, rather than claims that I hold a formal role in an organisation working on them.','Education connects directly to the stage of life I am in. Technology connects to the questions I continue to explore, while the wider causes are a reminder that decisions have a human and social context beyond their immediate result.'),
 sec('The standards I want to develop',
 'I am at the beginning of this journey. My goal is to become more capable through academic discipline, thoughtful reading, clear communication, and practical experience appropriate to my stage. I want my confidence to grow alongside evidence, rather than run ahead of it.',
 'This portfolio records that process. It brings together completed learning, lived experiences, language development, and the questions shaping my direction. I hope it gives a clearer picture of how I think and what I am working towards than a list of titles could provide.'),
],image='portrait.jpg',image_alt='Muhammad Subhan, photographed in a suit and tie',image_caption='Portrait supplied by Muhammad Subhan.',related=['education.html','direction.html','journal.html'])

add('education.html','The work beneath the ambition.','Education','International A Levels, a British-curriculum foundation, and a deliberate next academic step.',[
 sec('My academic foundation',
 'I study at Al-Rowad International Schools in Riyadh. My LinkedIn education record lists the school from May 2014 to May 2028; the end date is expected, not a completed qualification. I have completed my IGCSE examinations and am now in Grade 11, studying Mathematics, Physics, and Computer Science at AS/A-level.',
 'These subjects give me a demanding foundation for analytical work. They involve different kinds of reasoning, from organising a mathematical argument to understanding a physical system or expressing a process in code. I am interested in carrying that disciplined approach into future legal study, while recognising that legal reading and writing introduce their own methods and expectations.'),
 sec('Three subjects, complementary habits',
 'Mathematics encourages precision. A conclusion needs a defensible sequence of steps, and a small error can change the answer. Physics encourages attention to assumptions and the conditions under which a model is useful. Computer Science asks for structured thinking about information, systems, and how instructions produce an outcome.',
 'These connections are learning goals rather than claims of professional expertise. The work ahead includes strengthening written analysis, reading longer and more complex material, and developing the ability to explain a difficult idea without losing its meaning. A clear explanation is a useful test of whether I understand something myself.'),
 sec('Planning the next stage',
 'I expect to complete my A-levels in 2028. I am researching routes into legal education and the legal profession, including university study and the possibility of a solicitor apprenticeship. These are prospective routes, not admissions offers, confirmed funding arrangements, or an agreed training position.',
 'My immediate priority is the work I can do now: academic progress, careful research, and exposure to the profession that helps me understand its demands. I want any future decision to reflect the substance of the course, the opportunities it makes possible, and the practical realities of studying and working in another country.'),
 sec('Learning alongside school',
 'The short courses in my learning record sit alongside my school education. They allow me to explore business administration, finance, sales, resilience, and aviation topics in a structured way. They are separate from my school qualifications and do not replace formal legal study.',
 'Together, these strands show how I am using this stage of my education: building a core academic foundation while testing interests outside the classroom. My aim is to arrive at the next stage with better questions, stronger habits, and a more informed understanding of the field I want to enter.'),
],facts=[('School','Al-Rowad International Schools'),('Current stage','Grade 11 · International A Levels'),('Subjects','Mathematics, Physics, Computer Science'),('Expected completion','2028 · prospective')],related=['journey.html','learning.html','direction.html'])

add('journey.html','A direction earned over time.','Journey','A chronological record of education, independent learning, and a perspective that continues to develop.',[
 sec('A journey with more than one chapter',
 'My journey begins with school in Riyadh and continues through independent courses, volunteering, and events that have widened my view of different industries. It has not followed one unchanging career label. Aviation was a significant early interest; corporate and commercial law is the direction I am now working towards.',
 'The useful connection is the way I approach learning. I want to understand the systems behind an outcome and the responsibilities that make them work. That interest has travelled from aircraft and airports to businesses, technology, and the commercial questions around them.'),
 sec('Completed steps',
 'My learning record includes crew management and aviation management courses in 2024, business administration in December 2024, aircraft design in May 2025, and business finance in October 2025. In May 2025 I volunteered at an AIS graduation ceremony, helping with coordination, seating, setup, and backstage operations.',
 'Events in 2025 added direct exposure to aviation and cybersecurity. My posts record the Global Airports Forum, Sand & Fun Aviation Show, and Black Hat MEA. The latter also includes my report of completing ten hours of CPD activities. These entries represent learning and participation, rather than employment within those industries.'),
 sec('The current chapter',
 'In 2026, my interests expanded through technology, finance, and governance. My reflections from LEAP, Money20/20, and the UNESCO Global Forum on the Ethics of AI describe a shift towards questions of implementation, identity, risk, and accountability. Business courses in sales and resilience also became part of my learning record.',
 'I am now studying International A Levels and exploring a future in corporate law, with particular interests in mergers and acquisitions and private equity. The current chapter is about preparation: doing the academic work, learning what the profession involves, and finding appropriate opportunities to gain experience.'),
 sec('What lies ahead',
 'The expected completion of my A-levels in 2028 is a future milestone. University study, apprenticeships, professional examinations, and qualification are possible later steps, not achievements already reached. I want this timeline to remain clear about that distinction.',
 'A useful portfolio should be able to change as its owner grows. Earlier interests deserve context, and new ambitions deserve evidence as they develop. The purpose of this record is to show that progression honestly, including the questions that remain open.'),
],timeline=True,related=['education.html','experience.html','direction.html'])

add('direction.html','Where law meets enterprise.','Direction','An aspiring corporate lawyer exploring M&A, private equity, and the responsibilities behind commercial decisions.',[
 sec('Why corporate and commercial law',
 'I am interested in understanding how businesses operate, make decisions, and navigate complex legal and commercial issues. That is the central idea in my LinkedIn biography, and it is the direction that now connects my academic work with my wider reading and event experiences.',
 'Corporate law interests me because it invites questions about the organisation as a whole. What is a business trying to achieve? What information does it need before making a decision? Which people are affected? What responsibilities follow the transaction? I am still building the knowledge needed to engage with those questions properly.'),
 sec('Mergers, acquisitions, and private equity',
 'Mergers and acquisitions and private equity are particular areas of interest. I want to learn how transactions are understood from commercial, financial, and legal perspectives, and how the people involved manage uncertainty. My business administration and finance courses offer introductory context; they are the start of that learning, not a substitute for transaction experience.',
 'The detailed pages in this chapter present the questions I want to investigate. They do not describe deals I have worked on or clients I have advised. My aim is to develop the foundations that would make later study and supervised experience more useful.'),
 sec('Technology changes the questions',
 'My interest in technology is another part of this direction. At Money20/20 I was struck by questions around AI agents, identity, and authorisation. At the UNESCO forum I wrote about accountability, human oversight, and implementation. Those experiences made the relationship between business and responsibility more concrete for me.',
 'I want to develop commercial awareness that goes beyond following announcements. A useful next step is to examine what a new product or business model requires to work, who depends on it, and what could complicate its adoption. That is a habit I am developing through reflection and research.'),
 sec('Preparation at my current stage',
 'My priorities are academic progress, stronger analytical writing, clear communication, and an informed view of the profession. I am researching legal education routes and looking for suitable opportunities to learn from people already working in the field.',
 'I do not yet hold a law degree or professional legal qualification. I am an IAL student with a developing interest and a long-term ambition. The value of this portfolio is in showing the preparation behind that ambition and providing a record against which future progress can be assessed.'),
],related=['direction/transactions.html','direction/technology.html','education.html'])

add('skills.html','Capability, with its context.','Skills','Five profile-listed skills, connected to courses and practical examples instead of arbitrary scores.',[
 sec('What the profile actually lists',
 'My LinkedIn skills section lists Business Administration, Crew Management in Multi-Pilot Aircraft, Business Resilience, Entrepreneurship, and Sales Operations. Each is presented here with its context: the course associated with it, the kind of understanding it supports, and the practical limits of the evidence.',
 'A percentage would suggest a measurement that does not exist. This portfolio instead uses a learning record. A completed course demonstrates structured exposure to a subject. A volunteering entry demonstrates a practical activity. An event reflection demonstrates an attempt to interpret what I encountered. They are different kinds of evidence and should be read accordingly.'),
 sec('Business and commercial foundations',
 'Business Administration is linked to my Alison diploma course. Sales Operations is linked to Sales Fundamentals for Entrepreneurs on LinkedIn Learning. Entrepreneurship and Business Resilience are associated with Resilience: Thriving as an Entrepreneur. These courses represent introductory development across how organisations operate, engage customers, and respond to challenges.',
 'My finance learning adds another point of connection, even though finance is not separately listed in the five-skill profile section. The business capability page brings these strands together and shows the questions I want to explore next. I have not presented course completion as work experience or responsibility for running a business.'),
 sec('Communication and coordination',
 'The practical example in my record is school volunteering. At the AIS graduation ceremony I helped with event coordination, guest seating, logistics, setup, attendee guidance, and backstage operations. Those duties required attention to how individual tasks affected the wider programme.',
 'My public writing adds a different example of communication: describing experiences, organising observations, and identifying questions for further learning. The journal offers readers the opportunity to assess that work directly. Developing clear, well-supported writing remains an important next step for me.'),
 sec('Systems and responsible decisions',
 'Crew management learning, aviation events, cybersecurity exposure, and Computer Science study all connect to my interest in systems. They encourage questions about coordination, information, and the conditions needed for reliable outcomes. They do not establish pilot qualifications, cybersecurity certification, or professional engineering competence.',
 'The separate capability pages explore business foundations, communication, and systems thinking in more depth. Each connects the theme to evidence so that the reader can see both the relevance and the boundaries of the claim.'),
],related=['skills/business.html','skills/communication.html','skills/systems.html'],hub='skills')

add('learning.html','Learning that leaves a record.','Learning','Seven listed certifications across business, resilience, finance, and aviation, with separate course pages.',[
 sec('A record of independent learning',
 'My profile lists seven licenses and certifications: five from Alison and two from LinkedIn Learning. They cover crew management, aviation management, aircraft design, business administration, business finance, entrepreneurial resilience, and sales fundamentals. Each has a dedicated page with its listed issue date and a link to the credential shown on my profile.',
 'The record spans January 2024 to July 2026. That progression reflects both earlier aviation interests and a growing focus on business. The courses are useful as a structured way to investigate a subject, learn its language, and decide what deserves further study.'),
 sec('Reading the credentials accurately',
 'A short course is evidence of completed learning in the format offered by its provider. It is not automatically a professional licence, a university degree, a flight qualification, or a legal qualification. The title Diploma in Business Administration is the provider’s course title; it is kept separate from my school qualifications and any future higher education.',
 'Some of the same Alison courses also appear in my LinkedIn honours section. I have consolidated those duplicate entries here, rather than treating them as five additional achievements. The purpose is to make the learning record easy to understand and easy to trace.'),
 sec('Connections between subjects',
 'Business administration and finance provide introductory context for my interest in how organisations operate. Sales learning offers another angle: understanding how a business communicates value and reaches customers. Resilience learning connects to how people adapt when a plan changes or a setback requires a different response.',
 'The aviation courses belong to an earlier chapter and remain relevant as part of my interest in complex systems. Crew coordination, operations, and design all ask different questions about how a reliable outcome is achieved. They give context to my event reflections and show how my curiosity has developed over time.'),
 sec('What comes after completion',
 'My next task is to connect learning with better questions and, where appropriate, supervised practical experience. A certificate is a starting point for discussion: what did the subject introduce, what can I explain clearly, and what remains unfamiliar?',
 'The course pages separate the listed facts from broader learning context. This allows the portfolio to be detailed without implying that introductory study proves professional competence. Readers can follow the evidence directly and make their own assessment.'),
],hub='learning',related=['skills.html','education.html','journey.html'])

add('languages.html','Different languages. Honest levels.','Languages','Eight languages on my profile, from native or bilingual proficiency to early-stage learning.',[
 sec('A multilingual background',
 'My LinkedIn profile lists eight languages. Urdu and Punjabi are listed at native or bilingual proficiency. Hindi is listed at full professional proficiency. English is listed at professional working proficiency, and Arabic at limited working proficiency. French, German, and Korean are listed at elementary proficiency.',
 'Those differences matter. Listing eight languages does not mean speaking all eight fluently. This page keeps the stated levels visible and groups the detailed language pages by established languages, working languages, and early-stage learning. The aim is to show an accurate profile rather than turn a language count into a claim of uniform ability.'),
 sec('Communication in context',
 'My current school studies and public LinkedIn writing give context to the role of English in my academic and professional development. Urdu, Punjabi, and Hindi are part of the wider language profile I have chosen to record. Arabic is particularly relevant to the environment in which I live, while the elementary languages reflect ongoing exploration.',
 'Language ability includes more than recognising words. Listening, speaking, reading, and writing can develop at different rates. A broad proficiency label is a useful summary, but the purpose and difficulty of a particular task still matter. I do not claim professional translation, legal interpretation, or specialist language qualifications.'),
 sec('Scores and their limits',
 'My English entry includes a Duolingo score of 130 dated December 2025. My German entry includes a Duolingo score of 10 dated April 2025. These are reproduced as profile-reported notes. The available profile text does not establish that either is a formal examination result, so this portfolio does not convert them into a certified test score or a CEFR level.',
 'The stated proficiency labels remain the clearest summary available. Further assessment could provide a more detailed picture, but it should be based on an identified test or demonstrated task rather than inferred from an app score.'),
 sec('A continuing practice',
 'My wider goal is to communicate with more clarity and attention to context. That includes choosing words carefully, listening to different perspectives, and being candid when a language is still developing. The conversations I described after the UNESCO forum reinforced how much perspective can vary across countries and backgrounds.',
 'The detailed pages explain each group of languages and the limits of the claims. They keep the portfolio useful for a reader who needs to understand how I might communicate in a particular setting, while leaving room for the record to grow with future evidence.'),
],languages=True,related=['languages/established.html','languages/working.html','languages/exploring.html'])

add('experience.html','Responsibility starts in small tasks.','Experience','Student volunteering and event participation, with a clear distinction between doing, observing, and learning.',[
 sec('The practical experience in my record',
 'My LinkedIn volunteering section records a Student Volunteer role at Al-Rowad International Schools in May 2025. I assisted at a student graduation ceremony with event coordination, guest seating, logistics, setup, attendee guidance, and backstage operations. That is the practical role described in my profile.',
 'A school event can involve many small responsibilities that become important to the people relying on them. Helping an attendee find the correct place, keeping track of an immediate task, and supporting staff all contribute to the wider programme. The detailed volunteering page explains that work without enlarging it into a formal management position.'),
 sec('Learning through participation',
 'My event record includes aviation, cybersecurity, technology, finance, real estate, and AI governance. I have written about attending the Global Airports Forum, Sand & Fun, Black Hat MEA, LEAP, Money20/20, and the UNESCO Global Forum on the Ethics of AI. Each experience offered a different view of how an industry operates.',
 'These are records of participation and learning. They are separate from employment, speaking at an event, conducting professional audits, or advising an organisation. Where a post only announced an intention to attend, the event record preserves that distinction rather than treating registration as proof of attendance.'),
 sec('What I took from those experiences',
 'At the Global Airports Forum, I wrote about the coordination behind a seemingly simple passenger journey. At Black Hat MEA, I described exposure to security issues and reported completing ten hours of CPD activities. At Money20/20, questions about identity and authorisation stood out. At the UNESCO forum, I began thinking more about governance and implementation.',
 'The common thread is attention to what sits behind the visible result. I want to develop the ability to notice those connections, explain them carefully, and investigate them further. The journal gives more space to that process than a short event label can.'),
 sec('The experience I hope to build next',
 'I am interested in suitable opportunities to learn about legal work, commercial research, and professional communication at my current student stage. I would value experiences that give a realistic view of daily work and the standards expected of someone entering the profession.',
 'My current record is early. That is why this page is explicit about the role, setting, and evidence behind each entry. The next chapter should add substance to the portfolio through actual participation and responsibility, rather than through a more impressive description of the same activities.'),
],related=['experience/graduation.html','events.html','skills/communication.html'])

add('events.html','Places that changed the questions.','Events','Aviation, cybersecurity, finance, and governance encountered through Riyadh’s event ecosystem.',[
 sec('A wider classroom',
 'Industry events have given me a way to see interests beyond the classroom. My posts describe exhibitions, discussions, and conversations across aviation, cybersecurity, AI, finance, and real estate. What interests me is not simply the scale of an event, but the detail that changes how I understand an industry.',
 'The event pages capture that detail. Airport coordination, cybersecurity, identity in agentic commerce, accountability in AI, and the human side of urban development are different topics, yet they share questions about how systems serve people and how responsibilities are organised.'),
 sec('From demonstrations to decisions',
 'LEAP brought technologies into view through demonstrations and exhibitions. Money20/20 showed another layer: how companies build systems around identity, security, payments, and AI. The UNESCO forum moved the discussion towards governance, accountability, and implementation across different national contexts.',
 'That progression is relevant to my current interest in corporate law. A product or technology is one part of a wider commercial environment. I want to understand the people, decisions, and responsibilities around it. The reflections here develop those questions as a student, without presenting them as professional findings.'),
 sec('The earlier aviation chapter',
 'The Global Airports Forum and Sand & Fun belong to an earlier period when aviation was my intended career direction. My posts recorded both the precision of performance and the complexity of airport operations. Those experiences still belong in the story because they helped shape my attention to coordination and systems.',
 'The current perspective is different, but the earlier observations remain useful. I can now revisit them through questions about organisations, infrastructure, investment, and the relationship between technical work and decision-making.'),
 sec('A clear record of participation',
 'The pages identify whether the source is an attendance reflection, a reported CPD activity, or an announcement of intended participation. In particular, Global AI Show and Global Games Show posts announce attendance plans; they do not provide a detailed report of sessions attended. Their pages retain that limited evidence.',
 'Each entry links back to a relevant original post. That makes the record traceable and gives readers the source context alongside the expanded portfolio narrative. Event participation is presented as learning exposure, with its limits kept visible.'),
],hub='events',related=['journal.html','experience.html','direction/technology.html'])

add('journal.html','The question after the event.','Journal','Edited reflections on systems, responsibility, innovation, and the process of learning.',[
 sec('Why write about what I notice',
 'Writing is a way to make an experience useful after it ends. An exhibition can leave a strong impression without producing a clear understanding. A reflection asks what stood out, why it mattered, and which question deserves another look. My LinkedIn posts provide the source material for the essays collected here.',
 'These pages are edited adaptations and expansions of those posts. They keep the original experience in view while giving its central idea more space. They are student reflections, not legal advice, technical evaluations, or verified market forecasts.'),
 sec('Recurring themes',
 'One theme is the gap between what a system can do and what it takes to use it responsibly. My UNESCO reflection focuses on governance and accountability. My Money20/20 reflection asks about identity and authorisation when AI agents can act. My LEAP reflection considers what happens when a technology demonstration moves towards everyday use.',
 'Another theme is the human element. My Real Estate Future Forum post described the importance of people, interaction, and lived experience in making urban development meaningful. My writing about airports noticed how coordination can become almost invisible when it succeeds. These observations connect technology and organisation to the people they serve.'),
 sec('A developing commercial perspective',
 'My current interest in corporate law gives these subjects a new relevance. I want to understand how a business moves from an ambition to an operating product, how uncertainty shapes a decision, and how responsibilities are recognised. My introductory finance and administration courses support that interest, while leaving a great deal still to learn.',
 'The journal is part of developing that habit. It offers evidence of how I organise a thought and draw a connection. It also gives me something concrete to improve: clarity, supporting sources, the separation of fact from interpretation, and the discipline of making a conclusion no stronger than its evidence.'),
 sec('How to read this collection',
 'Each essay names its source and links to the original post. Event pages focus on the experience itself; journal pages focus on the question it prompted. Related links connect the two when they share a subject.',
 'The collection is a record of a perspective in development. I expect some ideas to become more precise as I study further and gain experience. Keeping the source context visible makes that growth easier to understand and prevents an early reflection from being mistaken for an established professional position.'),
],hub='journal',related=['events.html','direction.html','projects.html'])

add('projects.html','Making the thinking visible.','Projects','This portfolio as a practical project: organising a personal record into a clear, useful experience.',[
 sec('A project with a concrete purpose',
 'This portfolio is a practical project centred on a simple problem: a profile can contain many experiences without showing how they connect. Courses, event posts, school studies, languages, and ambitions can appear as separate lists. I wanted a site that gives them context and allows a visitor to follow the thread between them.',
 'The result is an original website with separate chapters for my biography, education, learning, capabilities, languages, experiences, events, journal, and direction. Detailed pages provide more space where a single summary would hide something useful. Source links allow readers to trace a credential or reflection back to its record.'),
 sec('Organisation as part of the work',
 'The content distinguishes completed study from intended next steps, volunteering from industry participation, and language development from fluency. It also consolidates duplicate course entries that appear in more than one LinkedIn section. These decisions are part of the project’s usefulness: readers should be able to understand the evidence without having to decode the structure of the source profile.',
 'A portfolio should also be usable at different levels of attention. A visitor can read a short overview, inspect a specific course, follow an event reflection, or use search to find a topic. Quick-scan controls on long pages provide a summary without removing the full narrative.'),
 sec('Interaction with a purpose',
 'The homepage scroll sequence connects curiosity, perspective, and direction. Its motion follows the reading progression, while short viewports use an unpinned layout to keep each chapter readable. Filters help narrow learning records and event topics. Related-page links connect a capability to an example rather than leaving it as a claim.',
 'The contact page prepares an editable email draft based on the purpose of a conversation. It does not pretend to deliver a message through a service that is not connected. That is a small example of a broader principle: an interaction should make its actual outcome clear.'),
 sec('What this project demonstrates',
 'The website demonstrates a personal effort to organise information, communicate a developing identity, and build a useful record of learning. It was created with AI-assisted development; it is not presented as evidence that I independently wrote every line of code. Its value is in the brief, the content choices, and the practical result.',
 'Future projects should add new evidence rather than duplicate the purpose of this one. For now, this is the project documented here. The detailed case page explains the design and content decisions for a reader interested in how the portfolio was put together.'),
],related=['projects/portfolio.html','journal.html','skills/systems.html'])

add('contact.html','A conversation with a purpose.','Contact','For student opportunities, thoughtful introductions, shared interests, and constructive feedback.',[
 sec('What I would value hearing about',
 'I welcome relevant conversations about corporate law, legal education, commercial awareness, technology, and appropriate opportunities for a student at my stage. I am currently studying International A Levels in Riyadh and working towards a future in corporate and commercial law. My interests include mergers and acquisitions, private equity, and the questions technology creates for businesses.',
 'An introduction is most useful when it gives a little context. Tell me who you are, what prompted the message, and the specific subject you would like to discuss. If you are responding to a page or reflection in this portfolio, naming it will help me understand the connection.'),
 sec('For opportunities and learning experiences',
 'For a school-supported activity, volunteering opportunity, event, or learning placement, useful details include the organisation, the expected activity, the time commitment, and any eligibility requirements. This allows the conversation to begin with a realistic understanding of the opportunity and its suitability for a current school student.',
 'I am particularly interested in experiences that provide a clearer view of professional work and the standards involved. I do not offer legal services, and this portfolio should not be read as a professional practice website. Messages about legal representation should be directed to an appropriately qualified professional.'),
 sec('For shared interests and feedback',
 'I also welcome thoughtful discussion about the subjects in the journal: AI governance, identity, cybersecurity, business, aviation, and how complex systems serve people. A useful question, an alternative interpretation, or a source that adds context can help me develop a more informed perspective.',
 'If you notice an error in the portfolio, please identify the page and the information that needs attention. Clear feedback is valuable, especially where the distinction between a completed achievement and a developing interest could be improved.'),
 sec('How the message composer works',
 'Choose a topic, enter your name and message, and select Prepare email. The website will open your email application with an editable draft addressed to me. Review that draft and send it from your own account. Nothing is submitted by this website, and there is no confirmation of delivery here.',
 'You can also copy the email address or open my LinkedIn profile. Your composer entries are not saved to a server. The purpose of the tool is simply to make the first message easier to structure while keeping the final wording and sending decision with you.'),
],contact=True,related=['about.html','direction.html','experience.html'])

from details import populate
from experiences import populate_experiences
populate(add,sec,PROFILE)
populate_experiences(add,sec,PROFILE)
add('journal/archive.html','Every question, in one place.','Journal','The complete collection of portfolio reflections, with a direct route to each full entry.',[
 sec('The complete reading list','This archive brings together every long-form journal entry in the portfolio. Each begins with an experience or learning activity in my original LinkedIn record and develops one question from it. The list above is the complete portfolio journal, rather than only the three selected reflections on the homepage.','Choose the subject that interests you, read the full entry, or follow its source link to the original post. The journal hub provides topic filters if you want to narrow the collection before choosing a page.'),
 sec('Three connected themes','Technology entries consider AI capability, identity, authorisation, and the transition from a demonstration to dependable use. Business entries consider the human purpose of development and the commercial setting around an innovation. Learning entries consider resilience, structured study, and how to test understanding.','These themes overlap because the underlying questions overlap. A new system has users, an organisation, and responsibilities around it. A learning tool needs more than an organised explanation. A physical project needs the people who give it a purpose.'),
 sec('The source behind each reflection','Each full entry names its source context and links to my original LinkedIn post. The extended prose is an edited expansion of the theme, not a claim that I originally published the exact same long-form essay. Event pages document the participation itself; journal pages give its central question more space.','The collection reflects a student perspective in development. It does not present legal advice, professional technical evaluations, or verified market forecasts. The purpose is to make my thinking visible and give me a clear record to improve.'),
 sec('How the collection can grow','Future entries should add a new observation, a better-supported argument, or a question that merits further study. Adding length alone would not make the archive more useful. I want each update to contribute something distinct to the wider record.','For now, the index shows the full collection available on this website. Related links inside each entry help connect the thought to a course, event, or direction. The result is a reading path through the portfolio, rather than a disconnected set of titles.')
],is_archive=True,related=['journal.html','events.html','direction.html'])
from render import render
render(PAGES,OUT,ORIGIN,PROFILE)
