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
 'My interests have moved towards corporate law, especially mergers and acquisitions and private equity. Aviation still matters to me; it was where I first became curious about how people, organisations, and decisions fit together. I now want to understand those connections in business, and how law helps organisations make difficult choices.'),
 sec('Learning beyond the classroom',
 'My learning includes courses across business and aviation, student volunteering, and reflections from events in Riyadh. At Black Hat MEA I explored cybersecurity. At Money20/20 I found myself asking about identity, authorisation, and the infrastructure behind AI-enabled commerce. At the UNESCO forum, the conversation shifted from technical capability to governance and accountability.',
 'I also enjoy expressing what I notice through writing. A useful reflection should do more than say that an event was interesting. It should explain what changed my understanding, identify a question worth pursuing, and distinguish an observation from a conclusion. The journal in this portfolio develops that habit.'),
 sec('Values beyond a career title',"I care about education, science and technology, human rights, economic opportunity, the environment, and animal welfare. They remind me to look beyond a career title and think about the people affected by decisions. Education is especially close to me because I am still discovering how much a good learning opportunity can change someone's direction.",'Education connects directly to the stage of life I am in. Technology connects to the questions I continue to explore, while the wider causes are a reminder that decisions have a human and social context beyond their immediate result.'),
 sec('The standards I want to develop',
 'I am still early in this journey, and I want to put the work in. That means taking school seriously, reading with care, improving my writing, and learning from people with more experience. I want to understand what I am talking about, and be comfortable asking questions when I do not.',
 'I wanted this website to bring those parts of my life together: what I have studied, where I have been, what caught my attention, and where I hope to go next. There is more to that story than a list of course titles. The connections between them are what interest me most.'),
],image='portrait-approved.png',image_alt='Muhammad Subhan, photographed in a suit and tie',image_caption='Muhammad Subhan · Riyadh',related=['education.html','direction.html','journal.html'])

add('education.html','The work beneath the ambition.','Education','International A Levels, a British-curriculum foundation, and a deliberate next academic step.',[
 sec('My academic foundation',
 'I study at Al-Rowad International Schools in Riyadh, where I have been a student since May 2014. I have completed my IGCSEs and am now in Grade 11, studying Mathematics, Physics, and Computer Science at AS/A-level. I expect to complete my A-levels in 2028, before taking the next step towards studying law.',
 'These subjects give me a demanding foundation for analytical work. They involve different kinds of reasoning, from organising a mathematical argument to understanding a physical system or expressing a process in code. I am interested in carrying that disciplined approach into future legal study, while recognising that legal reading and writing introduce their own methods and expectations.'),
 sec('Three subjects, complementary habits',
 'Mathematics encourages precision. A conclusion needs a defensible sequence of steps, and a small error can change the answer. Physics encourages attention to assumptions and the conditions under which a model is useful. Computer Science asks for structured thinking about information, systems, and how instructions produce an outcome.',
 'I also want to become a stronger reader and writer. Working through a difficult problem is useful, but so is explaining it clearly to someone else. Legal study will bring unfamiliar material and a different style of argument, and I want to build the patience and precision to approach it well.'),
 sec('Planning the next stage',
 'I expect to finish my A-levels in 2028. I am exploring university courses and other routes into the legal profession, including solicitor apprenticeships. I want to understand what each route involves, what I would need to prepare, and how it would fit the kind of work I hope to do.',
 'My immediate priority is the work I can do now: academic progress, careful research, and exposure to the profession that helps me understand its demands. I want any future decision to reflect the substance of the course, the opportunities it makes possible, and the practical realities of studying and working in another country.'),
 sec('Learning alongside school',
 'Alongside school, I have taken short courses in business administration, finance, sales, resilience, and aviation. They give me a way to explore an interest with some structure, instead of moving between unrelated explanations. I enjoy finding connections between a course, something I have seen at an event, and a question I want to follow up.',
 'Together, these strands show how I am using this stage of my education: building a core academic foundation while testing interests outside the classroom. My aim is to arrive at the next stage with better questions, stronger habits, and a more informed understanding of the field I want to enter.'),
],facts=[('School','Al-Rowad International Schools'),('Current stage','Grade 11 · International A Levels'),('Subjects','Mathematics, Physics, Computer Science'),('Expected completion','2028 · expected')],related=['journey.html','learning.html','direction.html'])

add('journey.html','A direction earned over time.','Journey','How school, independent learning, and experiences in Riyadh have shaped the direction I am taking.',[
 sec('A journey with more than one chapter',
 'My journey begins with school in Riyadh and continues through independent courses, volunteering, and events that have widened my view of different industries. It has not followed one unchanging career label. Aviation was a significant early interest; corporate and commercial law is the direction I am now working towards.',
 'The useful connection is the way I approach learning. I want to understand the systems behind an outcome and the responsibilities that make them work. That interest has travelled from aircraft and airports to businesses, technology, and the commercial questions around them.'),
 sec('Completed steps',
 'In 2024, I completed courses in crew management, aviation management, and business administration. Aircraft design followed in May 2025, and business finance in October. That same year, I volunteered at an AIS graduation ceremony, helping with seating, setup, coordination, and backstage support. Each experience gave me a different way to think about working with people.',
 'In 2025, I visited the Global Airports Forum, Sand & Fun Aviation Show, and Black Hat MEA. Aviation events brought me closer to a field I had been exploring, while Black Hat introduced a different set of questions about digital trust. I also completed ten hours of CPD activities at Black Hat, which I wrote about afterwards.'),
 sec('The current chapter',
 'In 2026, LEAP, Money20/20, and the UNESCO Global Forum on the Ethics of AI widened my interests towards technology, finance, and governance. I became more curious about how an idea is put into practice, who can authorise an action, and who takes responsibility. Courses in sales and entrepreneurial resilience added a business perspective to those questions.',
 'I am now studying International A Levels and exploring a future in corporate law, with particular interests in mergers and acquisitions and private equity. The current chapter is about preparation: doing the academic work, learning what the profession involves, and finding appropriate opportunities to gain experience.'),
 sec('What lies ahead',
 'My next major academic milestone is completing my A-levels in 2028. Beyond that, I want to find the right path into legal study and professional training. There are still decisions to make, and I would rather understand the options carefully than choose a route simply because its title sounds impressive.',
 'I expect my interests to keep developing. Aviation taught me to look at coordination; technology events made me think about responsibility; business learning made me ask about purpose and value. I want to keep those earlier experiences in view as I work towards law, because they help explain how I arrived here.'),
],timeline=True,related=['education.html','experience.html','direction.html'])

add('direction.html','Where law meets enterprise.','Direction','An aspiring corporate lawyer exploring M&A, private equity, and the responsibilities behind commercial decisions.',[
 sec('Why corporate and commercial law',
 'I am interested in understanding how businesses operate, make decisions, and navigate complex legal and commercial issues. That is the central idea behind my ambition, and it is the direction that now connects my academic work with my wider reading and event experiences.',
 'Corporate law interests me because it invites questions about the organisation as a whole. What is a business trying to achieve? What information does it need before making a decision? Which people are affected? What responsibilities follow the transaction? I am still building the knowledge needed to engage with those questions properly.'),
 sec('Mergers, acquisitions, and private equity',
 'M&A and private equity interest me because a transaction brings several ways of thinking together. There is the business purpose, the financial reasoning, the legal work, and the people making the decision. My administration and finance courses have given me a starting point, and I want to understand how those pieces fit together in practice.',
 'I am particularly curious about the reasoning behind a deal. What does each business want to achieve? What could change its view? Which questions need answering before people commit to the next step? I am learning how to approach those questions now, so that future study and experience have a stronger foundation.'),
 sec('Technology changes the questions',
 'My interest in technology is another part of this direction. At Money20/20 I was struck by questions around AI agents, identity, and authorisation. At the UNESCO forum I wrote about accountability, human oversight, and implementation. Those experiences made the relationship between business and responsibility more concrete for me.',
 'I want to develop commercial awareness that goes beyond following announcements. A useful next step is to examine what a new product or business model requires to work, who depends on it, and what could complicate its adoption. That is a habit I am developing through reflection and research.'),
 sec('Preparation at my current stage',
 'My priorities are academic progress, stronger analytical writing, clear communication, and an informed view of the profession. I am researching legal education routes and looking for suitable opportunities to learn from people already working in the field.',
 'For now, I am an IAL student preparing for that future. I want to improve my academic work, learn more about the profession, and find suitable opportunities to see how people work. A clear ambition gives me a direction; the day-to-day effort is what will make that direction meaningful.'),
],related=['direction/transactions.html','direction/technology.html','education.html'])

add('skills.html','Capability, with its context.','Skills','Business, communication, and coordination: what I am learning and where I have put it into practice.',[
 sec('What I am developing',
 'I have been learning about business administration, crew management, business resilience, entrepreneurship, and sales operations. Those subjects came from different interests, but they increasingly connect. I am drawn to how organisations work, how people communicate within them, and how a team responds when things change.',
 'I understand these skills best through examples. A course gives me a starting point; volunteering shows me what happens when someone needs clear guidance; writing makes me organise an idea well enough to explain it. I want to keep building on those experiences, rather than describe my ability with a percentage that says very little.'),
 sec('Business and commercial foundations',
 'Business Administration is linked to my Alison diploma course. Sales Operations is linked to Sales Fundamentals for Entrepreneurs on LinkedIn Learning. Entrepreneurship and Business Resilience are associated with Resilience: Thriving as an Entrepreneur. These courses represent introductory development across how organisations operate, engage customers, and respond to challenges.',
 'Finance adds another angle to my business learning. It makes me ask what an organisation is trying to achieve, which assumptions support a decision, and what information would change the answer. Together, administration, sales, resilience, and finance help me approach a company as a whole instead of looking at only one part of it.'),
 sec('Communication and coordination',
 'School volunteering gave me a practical setting for communication and coordination. At the AIS graduation ceremony, I helped with seating, logistics, setup, attendee guidance, and backstage tasks. Even a small responsibility needs attention when another person is relying on it, and those duties made that connection clear to me.',
 'My public writing adds a different example of communication: describing experiences, organising observations, and identifying questions for further learning. The journal offers readers the opportunity to assess that work directly. Developing clear, well-supported writing remains an important next step for me.'),
 sec('Systems and responsible decisions',
 'Computer Science, aviation learning, and technology events have all made me interested in systems. I want to know how the parts depend on one another, where information needs to move, and what happens when an assumption changes. It is a way of asking better questions that I want to carry into future commercial and legal study.',
 'Business, communication, and systems thinking are the three themes I return to here. They connect my courses to actual experiences and to the things I want to work on next. Some connections are already clear; others need more reading, practice, and a chance to learn from someone doing the work.'),
],related=['skills/business.html','skills/communication.html','skills/systems.html'],hub='skills')

add('learning.html','Learning beyond the classroom.','Learning','Seven courses in business and aviation, and the ideas I have carried forward from each.',[
 sec('Learning on my own initiative',
 'I have completed seven courses: five with Alison and two with LinkedIn Learning. They cover crew management, aviation management, aircraft design, business administration, business finance, resilience, and sales. Each course has its own page here, with the completion date, certificate link, and the ideas that connect it to my wider interests.',
 'I took these courses between January 2024 and July 2026. The earlier ones followed my interest in aviation; later ones gave me more room to explore business. I like having a structured introduction to a subject, because it helps me move from a broad curiosity to questions I can investigate more carefully.'),
 sec('Making room for independent learning',
 'These were short courses taken alongside school. The Diploma in Business Administration is an Alison course, while my formal academic work is my International A Levels. I find the two useful in different ways: school gives me a demanding foundation, and independent courses let me try subjects outside my timetable.',
 'Each course appears once in this collection. I want it to be easy to find what I studied, when I completed it, and what interested me about it. The certificate links sit alongside the explanation, so there is a direct way to see the course itself as well as my thoughts about it.'),
 sec('Connections between subjects',
 'Business administration and finance provide introductory context for my interest in how organisations operate. Sales learning offers another angle: understanding how a business communicates value and reaches customers. Resilience learning connects to how people adapt when a plan changes or a setback requires a different response.',
 'The aviation courses belong to an earlier chapter and remain relevant as part of my interest in complex systems. Crew coordination, operations, and design all ask different questions about how a reliable outcome is achieved. They give context to my event reflections and show how my curiosity has developed over time.'),
 sec('What comes after completion',
 'My next task is to connect learning with better questions and, where appropriate, supervised practical experience. A certificate is a starting point for discussion: what did the subject introduce, what can I explain clearly, and what remains unfamiliar?',
 'I want to keep returning to the ideas after a course ends. What can I explain now? What still feels unfamiliar? Where have I noticed the same question in another setting? Those are more useful measures of learning for me than collecting a certificate and moving straight on to the next title.'),
],hub='learning',related=['skills.html','education.html','journey.html'])

add('languages.html','Languages that connect me.','Languages','The languages I speak and the ones I am still learning, from Urdu and Punjabi to French, German, and Korean.',[
 sec('A multilingual background',
 'Urdu and Punjabi are my native languages, and I speak Hindi fluently. I use English for schoolwork, public writing, and professional communication. I have a limited working knowledge of Arabic, while French, German, and Korean are languages I am just beginning to learn.',
 'These languages are at different stages in my life. Some are familiar and established; others still need much more practice. I enjoy that variety, but I also know which conversations I am comfortable having and when I need more time, a clearer explanation, or help with an unfamiliar word.'),
 sec('Communication in context',
 'English is central to my studies and writing. Urdu, Punjabi, and Hindi connect to my wider background, while Arabic connects to the place I live. French, German, and Korean give me a chance to begin again as a learner, noticing how unfamiliar sounds and phrases gradually become easier to recognise.',
 'I want to communicate well, not simply know more words. Listening carefully, choosing a useful phrase, and understanding what someone means are all part of that. Reading, writing, speaking, and listening can progress differently, so I try to think about what a particular conversation or task actually needs.'),
 sec('Learning milestones',
 'My Duolingo learning notes include an English score of 130 from December 2025 and a German score of 10 from April 2025. I keep those as learning milestones. They are not formal examination results; the more useful question for me is what I can understand and express in each language.',
 'A score can mark a point in learning, but using a language takes practice. I want to become clearer in my writing, more attentive when listening, and more comfortable with unfamiliar phrasing. I am especially interested in making a difficult idea understandable without losing the meaning behind it.'),
 sec('A continuing practice',
 'My wider goal is to communicate with more clarity and attention to context. That includes choosing words carefully, listening to different perspectives, and being candid when a language is still developing. The conversations I described after the UNESCO forum reinforced how much perspective can vary across countries and backgrounds.',
 'The language pages bring these different stages together: Urdu, Punjabi, and Hindi; English and Arabic; and the three languages I am beginning. I want to keep improving each in ways that suit its place in my life, with clearer writing, better listening, and more confidence in the conversations I can handle.'),
],languages=True,related=['languages/established.html','languages/working.html','languages/exploring.html'])

add('experience.html','Responsibility starts in small tasks.','Experience','Student volunteering and event participation, with a clear distinction between doing, observing, and learning.',[
 sec('Helping at school',
 'I volunteered at an Al-Rowad International Schools graduation ceremony in May 2025. I helped with guest seating, logistics, setup, attendee guidance, and backstage operations. It was a chance to support staff and students on a day that mattered to them, while seeing how separate tasks contribute to the same programme.',
 'A school event can involve many small responsibilities that become important to the people relying on them. Helping an attendee find the correct place, keeping track of an immediate task, and supporting staff all contribute to the wider programme. The detailed volunteering page explains that work without enlarging it into a formal management position.'),
 sec('Learning through participation',
 'I have also explored aviation, cybersecurity, technology, finance, real estate, and AI governance through events in Riyadh. The Global Airports Forum, Sand & Fun, Black Hat MEA, LEAP, Money20/20, and the UNESCO forum each introduced something different. I enjoyed seeing how people discuss an industry when they work within it.',
 'I attended these events to learn and listen. Exhibitions made ideas tangible, and conversations gave me a view beyond the classroom. For the Global AI Show and Global Games Show, I announced plans to attend; I have kept those plans separate from the visits I have written about afterwards.'),
 sec('What I took from those experiences',
 'The Global Airports Forum made me notice the coordination behind a passenger journey. At Black Hat MEA, I explored security topics and completed ten hours of CPD activities. Money20/20 drew my attention to identity and authorisation, and the UNESCO forum made me think more about governance and how principles become actual decisions.',
 'The common thread is attention to what sits behind the visible result. I want to develop the ability to notice those connections, explain them carefully, and investigate them further. The journal gives more space to that process than a short event label can.'),
 sec('The experience I hope to build next',
 'I am interested in suitable opportunities to learn about legal work, commercial research, and professional communication at my current student stage. I would value experiences that give a realistic view of daily work and the standards expected of someone entering the profession.',
 'I would like my next experiences to bring more responsibility and a closer view of professional work. I am still at school, so I am looking for opportunities that fit that stage. Being able to ask questions, help with a useful task, and learn how someone approaches their work would matter to me.'),
],related=['experience/graduation.html','events.html','skills/communication.html'])

add('events.html','Places that changed the questions.','Events','Aviation, cybersecurity, finance, and governance encountered through Riyadh’s event ecosystem.',[
 sec('A wider classroom',
 'Industry events have given me a way to see interests beyond the classroom. My posts describe exhibitions, discussions, and conversations across aviation, cybersecurity, AI, finance, and real estate. What interests me is not simply the scale of an event, but the detail that changes how I understand an industry.',
 'The event pages capture that detail. Airport coordination, cybersecurity, identity in agentic commerce, accountability in AI, and the human side of urban development are different topics, yet they share questions about how systems serve people and how responsibilities are organised.'),
 sec('From demonstrations to decisions',
 'LEAP brought technologies into view through demonstrations and exhibitions. Money20/20 showed another layer: how companies build systems around identity, security, payments, and AI. The UNESCO forum moved the discussion towards governance, accountability, and implementation across different national contexts.',
 'That progression is relevant to my current interest in corporate law. A product or technology is one part of a wider commercial environment. I want to understand the people, decisions, and responsibilities around it. The reflections here develop those questions as a student, without presenting them as professional findings.'),
 sec('The earlier aviation chapter',
 'The Global Airports Forum and Sand & Fun come from a time when I hoped to pursue aviation. I was fascinated by the precision of the displays and the complexity behind airport operations. Those interests still help me notice coordination and preparation, even as my intended career has moved towards corporate law.',
 'The current perspective is different, but the earlier observations remain useful. I can now revisit them through questions about organisations, infrastructure, investment, and the relationship between technical work and decision-making.'),
 sec('Visits, reflections, and future plans',
 'Most of these pages come from events I attended and wrote about afterwards. The Global AI Show and Global Games Show are different: I announced plans to attend, but have not added an account of a completed visit. I want that difference to stay clear while keeping the interests behind those plans part of the story.',
 'I have linked my original posts for anyone who would like to read the first reflection. Here, I give the ideas more space and connect them to other experiences. An event might last a day or a few days, but a question from it can stay with me much longer.'),
],hub='events',related=['journal.html','experience.html','direction/technology.html'])

add('journal.html','The question after the event.','Journal','My thoughts on technology, responsibility, innovation, and what it means to learn.',[
 sec('Why write about what I notice',
 'Writing helps me understand what I took from an experience. An exhibition can leave a strong impression, but I want to ask what stood out, why it mattered, and what I still do not understand. These essays began with my original posts and give me more room to work through those questions.',
 'I have expanded the ideas I first shared after events and courses. The aim is to slow down and think about a particular question, rather than squeeze everything into a short update. I am writing as a student, and I expect my understanding to become more precise as I keep learning.'),
 sec('Recurring themes',
 'One theme is the gap between what a system can do and what it takes to use it responsibly. My UNESCO reflection focuses on governance and accountability. My Money20/20 reflection asks about identity and authorisation when AI agents can act. My LEAP reflection considers what happens when a technology demonstration moves towards everyday use.',
 'Another theme is the human element. My Real Estate Future Forum post described the importance of people, interaction, and lived experience in making urban development meaningful. My writing about airports noticed how coordination can become almost invisible when it succeeds. These observations connect technology and organisation to the people they serve.'),
 sec('A developing commercial perspective',
 'My current interest in corporate law gives these subjects a new relevance. I want to understand how a business moves from an ambition to an operating product, how uncertainty shapes a decision, and how responsibilities are recognised. My introductory finance and administration courses support that interest, while leaving a great deal still to learn.',
 'The journal gives me something to work on. Can I explain the idea clearly? Have I separated what I saw from what I think it means? Is there a question worth pursuing beyond the first impression? I enjoy writing, and I want the effort to produce better understanding as well as a finished paragraph.'),
 sec('How to read this collection',
 'You can follow an essay back to its original post, or read about the event that prompted it. I have linked related subjects because the same question often appears in different places. Identity, responsibility, coordination, and purpose connect much of my reading, even when the industries look very different.',
 'These are thoughts I expect to revisit. A conversation, a course, or a better explanation can change how I understand something, and I want to leave room for that. Writing gives me a way to notice the change: what I thought at first, what challenged it, and what I would now ask differently.'),
],hub='journal',related=['events.html','direction.html','projects.html'])

add('projects.html','Making the thinking visible.','Projects','My portfolio website: bringing my interests, learning, and experiences together in one place.',[
 sec('A project with a concrete purpose',
 'I wanted a website that felt like me and showed how my interests connect. School, courses, languages, event visits, and career plans can look like separate lists. The project was about giving them a shared story, while making it easy for someone to find the part they want to explore.',
 'The site has separate chapters for my background, education, learning, languages, experiences, journal, and future direction. Each subject has room for more than a title. A course can lead to an event, an event to a question, and that question to something I want to study next.'),
 sec('Organisation as part of the work',
 'I wanted the writing to be clear about where I am now and where I hope to go. Schoolwork, a completed course, a volunteering task, and a future plan have different places in that story. Keeping them connected makes the website more useful than repeating the same achievement in several lists.',
 'A portfolio should also be usable at different levels of attention. A visitor can read a short overview, inspect a specific course, follow an event reflection, or use search to find a topic. Quick-scan controls on long pages provide a summary without removing the full narrative.'),
 sec('Interaction with a purpose',
 'The homepage moves through curiosity, perspective, and direction as you scroll. Smaller and shorter screens give the chapters more room to stay readable. Filters, search, and related links help someone follow an interest without having to read the site from beginning to end.',
 'The contact composer helps a visitor put a first message together. It prepares a draft in their own email app, where they can change the wording and choose to send it. I wanted that small interaction to be straightforward, with a clear way to copy the draft if the email app does not open.'),
 sec('What this project demonstrates',
 'I created the site with AI-assisted development, starting from my brief, personal information, and design preferences. I wanted something formal enough to take seriously, but with warmth, movement, and a sense of who I am. The interesting work was bringing those aims together in a website people can actually use.',
 'I want future projects to give me something new to learn and something useful to make. This website is a starting point: a way to organise my interests and share my writing. As those interests develop, I would like the work I add to have a purpose beyond simply making the site bigger.'),
],related=['projects/portfolio.html','journal.html','skills/systems.html'])

add('contact.html','A conversation with a purpose.','Contact','For student opportunities, thoughtful introductions, shared interests, and constructive feedback.',[
 sec('What I would value hearing about',
 'I welcome relevant conversations about corporate law, legal education, commercial awareness, technology, and appropriate opportunities for a student at my stage. I am currently studying International A Levels in Riyadh and working towards a future in corporate and commercial law. My interests include mergers and acquisitions, private equity, and the questions technology creates for businesses.',
 'An introduction is most useful when it gives a little context. Tell me who you are, what prompted the message, and the specific subject you would like to discuss. If you are responding to a page or reflection in this portfolio, naming it will help me understand the connection.'),
 sec('For opportunities and learning experiences',
 'For a school-supported activity, volunteering opportunity, event, or learning placement, useful details include the organisation, the expected activity, the time commitment, and any eligibility requirements. This allows the conversation to begin with a realistic understanding of the opportunity and its suitability for a current school student.',
 'I would especially value a chance to learn about professional work at a stage appropriate for a school student. Seeing how someone researches, communicates, and approaches a task would help me understand the profession more realistically. I am interested in learning opportunities and conversations about the path ahead.'),
 sec('For shared interests and feedback',
 'I enjoy discussing the questions in my journal: AI governance, identity, cybersecurity, business, aviation, and how systems serve people. If something makes you see the subject differently, I would like to hear why. A thoughtful question or another perspective can be the beginning of a useful conversation.',
 'If something on the site needs correcting, tell me which page you noticed it on and what you think should change. I welcome clear, constructive feedback. It helps me improve the writing and make the website more useful for the next person who reads it.'),
 sec('How the message composer works',
 'Choose a topic, enter your name and message, and select Prepare email. The website will open your email application with an editable draft addressed to me. Review that draft and send it from your own account. Nothing is submitted by this website, and there is no confirmation of delivery here.',
 'You can also email me directly or use the link to connect with me. The composer simply helps you prepare the wording; it does not save your message on a server. You review the draft and choose to send it from your own email account.'),
],contact=True,related=['about.html','direction.html','experience.html'])

from details import populate
from experiences import populate_experiences
populate(add,sec,PROFILE)
populate_experiences(add,sec,PROFILE)
add('journal/archive.html','Every question, in one place.','Journal','The complete collection of portfolio reflections, with a direct route to each full entry.',[
 sec('The complete reading list','This is the full collection of my journal essays. Each begins with something I encountered at an event or while learning, then follows the question that stayed with me. If a reflection on the homepage catches your attention, this is where you can find the rest of the writing.','Start with whichever subject interests you. You can read the essay, follow it back to the original post, or use the topic filters on the journal page to narrow the list. The related links offer another route, connecting a thought to the course, visit, or interest behind it.'),
 sec('Three connected themes','Technology entries consider AI capability, identity, authorisation, and the transition from a demonstration to dependable use. Business entries consider the human purpose of development and the commercial setting around an innovation. Learning entries consider resilience, structured study, and how to test understanding.','These themes overlap because the underlying questions overlap. A new system has users, an organisation, and responsibilities around it. A learning tool needs more than an organised explanation. A physical project needs the people who give it a purpose.'),
 sec('Where each essay began','The essays grew from my original posts, which are linked at the end of each page. I have given the ideas more room here, so the longer essay may go beyond what I wrote at the time. The event pages tell the story of the visit; the journal follows the thought it prompted.','I am writing from the perspective of a student trying to understand the subjects that interest me. Some questions are still open, and others will change as I learn more. The journal gives me a place to work through that uncertainty, practise clearer explanations, and come back to an idea later.'),
 sec('How the collection can grow','I want each new essay to contribute something: an observation I had missed, a connection I understand better, or a question that deserves more attention. A longer page is only useful if there is a reason to keep reading. I would rather develop a thought carefully than add words just to fill space.','The collection connects to the rest of the site through courses, events, and my interest in corporate law. You can follow those links wherever they lead your curiosity. For me, the value is in seeing how an idea travels from one setting to another and becomes more useful along the way.')
],is_archive=True,related=['journal.html','events.html','direction.html'])
from portfolio import prepare
prepare(PAGES,OUT)
from render import render
render(PAGES,OUT,ORIGIN,PROFILE)
