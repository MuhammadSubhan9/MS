"""A concise, single home for learning and experience."""
from html import escape

GROUPS = {'skills': 'capabilities', 'learning': 'learning', 'languages': 'languages',
          'experience': 'experience', 'events': 'events', 'projects': 'projects'}

def destination(path):
    group = path.split('/')[0].removesuffix('.html')
    if group not in GROUPS:
        return path
    fragment = GROUPS[group]
    if '/' in path and group == 'learning':
        fragment = 'course-' + path.split('/')[-1].removesuffix('.html')
    if '/' in path and group == 'events':
        fragment = 'event-' + path.split('/')[-1].removesuffix('.html')
    return 'portfolio.html#' + fragment

def prepare(pages, out):
    courses = [p for p in pages.values() if p['path'].startswith('learning/')]
    events = [p for p in pages.values() if p['path'].startswith('events/')]
    removed = [path for path in pages if path.startswith('journal/') or path == 'journal.html'
               or path.split('/')[0].removesuffix('.html') in GROUPS]
    redirects = []
    for path in removed:
        del pages[path]
        if not path.startswith('journal'):
            target = '/' + destination(path)
            redirects.extend([f'/{path} {target} 301', f'/{path.removesuffix(".html")} {target} 301'])
    # Only remove generated HTML inside the output directory. Authored source stays intact.
    for path in removed:
        target = (out / path).resolve()
        target.relative_to(out.resolve())
        if target.is_file():
            target.unlink()
    replacements = [('journal essays', 'original posts'), ('journal essay', 'original post'),
                    ('the journal', 'my writing'), ('my journal', 'my writing'),
                    ('journal entries', 'posts'), ('journal', 'writing')]
    for page in pages.values():
        page['related'] = list(dict.fromkeys(destination(path) for path in page.get('related', [])
                                            if not path.startswith('journal')))
        # Related cards link to the unified overview; specific links elsewhere keep their anchor.
        page['related'] = list(dict.fromkeys(path.split('#')[0] for path in page['related']))
        for section in page['sections']:
            for old, new in replacements:
                section['paragraphs'] = [text.replace(old, new) for text in section['paragraphs']]
    summaries = [
        ('Capabilities', 'I am developing commercial awareness, clear communication, and a way of thinking about how systems fit together.'),
        ('Learning', 'Seven completed courses alongside school: ' + '; '.join(p['title'] for p in courses) + '.'),
        ('Languages', 'Urdu and Punjabi are my native languages. I speak Hindi fluently, use English for study and writing, have a limited working knowledge of Arabic, and am beginning French, German, and Korean.'),
        ('Experience', 'Student Volunteer at the Al-Rowad International Schools graduation ceremony, May 2025: guest seating, attendee guidance, setup, logistics, and backstage support.'),
        ('Events', 'Visits across technology, business, and aviation: ' + '; '.join(p.get('label', p['title']) for p in events if 'announced' not in p.get('date', '').lower()) + '.'),
        ('Projects', 'I created this portfolio with AI-assisted development to bring my interests, learning, and experiences together. The work included content, design decisions, and testing on different screen sizes.')
    ]
    pages['portfolio.html'] = dict(path='portfolio.html', title='Beyond the classroom.', category='Portfolio',
        description='My capabilities, courses, languages, volunteering, events, and website project—together in one readable overview.',
        sections=[dict(title=title, paragraphs=[text]) for title, text in summaries],
        compact_profile=True, courses=courses, events=events)
    (out / '_redirects').write_text('\n'.join(redirects) + '\n', encoding='utf-8')

def portfolio_html(page, card):
    E = escape
    courses = ''
    for course in page['courses']:
        facts = dict(course.get('facts', []))
        key = course['path'].split('/')[-1].removesuffix('.html')
        courses += f'<li id="course-{E(key)}"><div><h3>{E(course["title"])}</h3><p>{E(facts.get("Provider", ""))} <span>· {E(course["date"])}</span></p></div><a href="{E(course["source"], quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="View certificate for {E(course["title"], quote=True)}">Certificate <span aria-hidden="true">↗</span></a></li>'
    event_lookup = {p['path'].split('/')[-1].removesuffix('.html'): p for p in page['events']}
    featured = ''
    for key, description in [
        ('unesco', 'AI, accountability, and the people responsible for decisions.'),
        ('money2020', 'Finance, digital identity, and permission when AI agents act.'),
        ('leap', 'Innovation—and what it takes to turn a demonstration into dependable use.')]:
        event = dict(event_lookup[key])
        event.update(title=event['label'], description=description, external_card=True)
        featured += f'<div id="event-{key}" class="portfolio-event">' + card(event) + '</div>'
    more_events = ''
    for key, note in [('airports', 'The coordination behind aviation.'), ('blackhat', 'Cybersecurity and ten hours of CPD activities.'),
                      ('real-estate', 'The people behind a place.'), ('sand-and-fun', 'Aviation beyond the classroom.'),
                      ('electric-mobility', 'Electric vehicles and the systems around them.')]:
        event = event_lookup[key]
        more_events += f'<a id="event-{key}" href="{E(event["source"], quote=True)}" target="_blank" rel="noopener noreferrer"><div><strong>{E(event["label"])}</strong><span>{E(note)}</span></div><span class="event-date">{E(event["date"])}</span><span aria-hidden="true">↗</span></a>'
    planned = ''.join(f'<span id="event-{key}">{E(event_lookup[key]["label"])}</span>' for key in ['global-ai', 'global-games'])
    links = ''.join(f'<a href="#{key}">{label}</a>' for key, label in [('capabilities','Capabilities'),('learning','Learning'),('languages','Languages'),('experience','Experience'),('events','Events'),('projects','Projects')])
    return f'''<header class="page-hero portfolio-hero"><div class="wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span aria-current="page">Beyond the classroom</span></nav><p class="eyebrow">Learning in different places</p><h1>Beyond<br><em>the classroom.</em></h1><p class="lead">What I have studied, where I have taken part, and what I am developing along the way.</p><div class="portfolio-intro-notes"><span>Business & aviation</span><span>Languages & communication</span><span>Technology & responsibility</span></div></div></header>
<nav class="portfolio-jump" aria-label="On this page"><div class="wrap">{links}</div></nav>
<div class="wrap portfolio-content">
<section id="capabilities" class="portfolio-section"><div class="portfolio-heading reveal"><p class="eyebrow">01 / Capabilities</p><h2>What I am <em>developing.</em></h2></div><div class="capability-grid">
<article class="reveal"><span class="capability-number">01</span><h3>Commercial awareness</h3><p>Business administration, finance, sales, and resilience courses give me an introduction to how organisations work. I am learning to connect a business decision to its purpose, customers, and uncertainties.</p></article>
<article class="reveal"><span class="capability-number">02</span><h3>Clear communication</h3><p>School volunteering, writing, and languages give me ways to practise explaining an idea, listening carefully, and making the next step clear for someone else.</p></article>
<article class="reveal"><span class="capability-number">03</span><h3>Thinking in systems</h3><p>Aviation and technology make me curious about the work behind an outcome: who coordinates it, which information matters, and where responsibility sits.</p></article></div></section>
<section id="learning" class="portfolio-section"><div class="portfolio-heading reveal"><p class="eyebrow">02 / Learning</p><h2>Seven courses.<br><em>A broader foundation.</em></h2><p>Completed alongside my school studies. Each certificate is linked directly below.</p></div><ul class="course-list reveal">{courses}</ul></section>
<section id="languages" class="portfolio-section"><div class="portfolio-heading reveal"><p class="eyebrow">03 / Languages</p><h2>Different languages.<br><em>Different stages.</em></h2></div><div class="language-groups">
<article class="reveal"><span class="eyebrow">My background</span><h3>Urdu · Punjabi · Hindi</h3><p>Urdu and Punjabi are my native languages. I speak Hindi fluently.</p></article>
<article class="reveal"><span class="eyebrow">Study & everyday life</span><h3>English · Arabic</h3><p>I use English for schoolwork, writing, and professional communication. I have a limited working knowledge of Arabic.</p></article>
<article class="reveal"><span class="eyebrow">At the beginning</span><h3>French · German · Korean</h3><p>I am learning the basics of these three languages.</p></article></div><p class="portfolio-footnote">Duolingo learning milestones: English 130 (December 2025) and German 10 (April 2025). These are learning notes, rather than formal examination results.</p></section>
<section id="experience" class="portfolio-section"><div class="portfolio-heading reveal"><p class="eyebrow">04 / Experience</p><h2>Helping the day<br><em>run smoothly.</em></h2></div><article class="volunteer-card reveal"><div><p class="eyebrow">May 2025 · Al-Rowad International Schools</p><h3>Graduation ceremony<br><em>Student Volunteer</em></h3></div><div><p>I supported staff and students with event coordination, guest seating, setup, logistics, attendee guidance, and backstage operations. It was a practical lesson in teamwork: the small things someone does can make the whole event easier for others.</p><ul class="task-tags"><li>Guest guidance</li><li>Event setup</li><li>Logistics</li><li>Backstage support</li></ul></div></article></section>
<section id="events" class="portfolio-section"><div class="portfolio-heading reveal"><p class="eyebrow">05 / Events</p><h2>Experiences that<br><em>widened the view.</em></h2><p>Visits across business, technology, and aviation. Open an event to read my original post, or follow its connection to my interests.</p></div><div class="cards portfolio-events">{featured}</div><div class="more-events">{more_events}</div><p class="portfolio-footnote">I also announced plans to explore {planned}. Those announcements describe interests and plans, rather than confirmed attendance.</p></section>
<section id="projects" class="portfolio-section"><div class="portfolio-heading reveal"><p class="eyebrow">06 / Projects</p><h2>A place for<br><em>the story so far.</em></h2></div><article class="project-brief reveal"><span class="project-monogram" aria-hidden="true">MS</span><div><p class="eyebrow">This portfolio</p><h3>Bringing the pieces together.</h3><p>I created this website with AI-assisted development, shaping the content, design, and interactions around my own interests and experiences. The work included organising information, checking the writing, and testing it across phone, tablet, and desktop layouts.</p><a class="text-link" href="contact.html">Share a useful observation <span aria-hidden="true">↗</span></a></div></article></section>
</div>'''
