# Surfmate Website

Eine moderne, statische Website für Surfmate mit animiertem Logo, modularem CSS-System und sauberer Codestruktur.

## 🌊 Features

- **Modulares CSS-System**: Saubere Trennung von Komponenten-spezifischen Styles
- **Animierte Wellenanimation**: Smooth Logo-Animation mit iframe-basierter Lösung
- **Responsive Design**: Mobile-first Ansatz mit flexibler Navigation
- **Performance-optimiert**: Statische Website ohne CMS-Overhead
- **Barrierefreie Navigation**: Screen-reader freundlich mit ARIA-Labels
- **Wartbarer Code**: Modulare CSS-Struktur für einfache Anpassungen
- **Legale Seiten**: Vollständiges Impressum und Datenschutzerklärung

## 📁 Projektstruktur

```
surfmate-website/
├── index.html              # Hauptseite mit Hero-Sektion und Waitlist
├── impressum.html           # Impressum-Seite
├── datenschutz.html         # Datenschutz-Seite
├── animation-bewegende-welle.html  # Standalone Wellenanimation
├── animation.css            # Animation-spezifische Styles
├── css/
│   ├── main.css            # CSS-Import-Datei
│   ├── reset.css           # CSS Reset
│   ├── variables.css       # CSS Custom Properties
│   ├── base.css            # Base Styles & Typography
│   ├── header.css          # Header & Navigation
│   ├── footer.css          # Footer Styles
│   ├── layout.css          # Page-Layouts & Hero-Sektion
│   ├── about.css           # About-Sektion Styles
│   ├── logo-animation.css  # Logo-Animation Container
│   ├── waitlist.css        # Waitlist-Formular
│   ├── legal.css           # Impressum & Datenschutz Styles
│   └── datenschutz.css     # Datenschutz-spezifische Styles
├── js/
│   ├── includes.js         # HTML-Includes Management
│   ├── navigation.js       # Mobile Navigation Logic
│   ├── waitlist.js         # Waitlist-Formular Handler
│   └── wave-animation.js   # Wellenanimation-Controller
├── includes/
│   ├── header.html         # Header-Komponente
│   ├── footer.html         # Footer-Komponente
│   ├── hero.html           # Hero-Sektion
│   ├── about.html          # About-Sektion
│   ├── waitlist.html       # Waitlist-Komponente
│   └── logo-animation.html # Logo-Animation Container
├── components/
│   └── surfmate-logo.html  # SVG Logo Component
└── assets/
    ├── surfers-preparing_edited.jpg  # Hero-Hintergrundbild
    ├── surf-background.jpg           # Sektions-Hintergrundbild
    └── fonts/                        # Custom Fonts
```

## 🎨 CSS-Architektur

### Modulares System

Das CSS ist in logische Module aufgeteilt:

1. **reset.css** - Normalisiert Browser-Standards
2. **variables.css** - CSS Custom Properties für konsistente Werte
3. **base.css** - Grundlegende Styles und Typography
4. **header.css** - Navigation und Header-Komponenten
5. **footer.css** - Footer-Styles
6. **layout.css** - Page-Layouts, Hero-Sektion und Dark-Sections
7. **about.css** - About-Sektion spezifische Styles
8. **logo-animation.css** - Logo-Animation Container und Video-Background
9. **waitlist.css** - Waitlist-Formular und Custom-Styling
10. **legal.css** - Gemeinsame Styles für Impressum und Datenschutz
11. **datenschutz.css** - Spezielle Datenschutz-Highlights und Listen

### Komponenten-basierte Struktur

Jede größere Komponente hat ihre eigene CSS-Datei für:

- **Bessere Wartbarkeit**: Änderungen bleiben isoliert
- **Modulare Entwicklung**: Komponenten können unabhängig bearbeitet werden
- **Performance**: Nur relevante Styles werden geladen

### CSS Custom Properties

Alle wichtigen Werte sind als CSS-Variablen definiert:

```css
:root {
  --surfmate-blue: #1a5490;
  --surfmate-light-blue: #4a90e2;
  --spacing-md: 1rem;
  --border-radius-md: 8px;
  /* ... weitere Variablen */
}
```

## ⚡ JavaScript-Komponenten

### Navigation (navigation.js)

- Mobile Navigation Toggle
- Active Link Management
- Smooth Header-Transitions beim Scrollen
- Event Handling für Responsive Design

### HTML Includes (includes.js)

- Dynamisches Laden von HTML-Komponenten
- Template-System für Header, Footer und Sektionen
- Fehlerbehandlung für Include-Pfade

### Waitlist Management (waitlist.js)

- E-Mail-Formular-Validierung
- MailerLite API Integration für Newsletter-Anmeldungen
- Success/Error State Management
- Responsive Formular-Verhalten

### Wave Animation (wave-animation.js)

- Smooth SVG-Pfad Animation für Wellenanimation
- Performance-Optimierung mit `requestAnimationFrame`
- Automatic Pause bei Hintergrund-Tab (Batterie-schonend)
- iframe-basierte Animation-Integration

## 🚀 Entwicklung

### Lokaler Server starten

Da die Website relative Pfade verwendet, sollte sie über einen lokalen Server getestet werden:

```bash
# Mit Python
python -m http.server 8000

# Mit Node.js (http-server)
npx http-server

# Mit PHP
php -S localhost:8000
```

### Live Server (VS Code)

Empfohlene VS Code Extensions:

- Live Server - für Live-Reload während der Entwicklung
- Auto Rename Tag - für HTML Tag-Management
- CSS Peek - für CSS-Navigation

## 📱 Responsive Design

Das Design ist mobile-first entwickelt:

- **Mobile** (320px - 768px): Collapsed Navigation, Touch-optimierte Buttons
- **Tablet** (768px - 1024px): Erweiterte Navigation, angepasste Layouts
- **Desktop** (1024px+): Full Navigation, optimierte Abstände

## ♿ Barrierefreiheit

- Semantisches HTML5
- ARIA-Labels für Screen Reader
- Keyboard Navigation Support
- Ausreichende Farbkontraste
- Focus-States für alle interaktiven Elemente

## 🔧 Anpassungen

### Farben ändern

Farben können zentral in `css/variables.css` angepasst werden:

```css
:root {
  --surfmate-blue: #deine-neue-farbe;
}
```

### Animation anpassen

Die Wellenanimation kann in `js/wave-animation.js` konfiguriert werden:

```javascript
// Animation-Parameter
this.amplitude = 10; // Wellenhöhe
this.frequency = 2; // Wellenfrequenz
this.waveLength = 350; // Wellenlänge
```

### Content anpassen

- **Impressum**: Platzhalter in `impressum.html` durch echte Daten ersetzen
- **Datenschutz**: Platzhalter in `datenschutz.html` durch echte Daten ersetzen
- **Meta-Tags**: SEO-relevante Meta-Tags in allen HTML-Dateien anpassen

## 📝 Next Steps

1. **SEO optimieren**: Schema.org Markup, erweiterte Meta-Tags hinzufügen
2. **Performance**: CSS/JS Minification für Production-Build
3. **Analytics**: Google Analytics oder alternative Tracking-Lösung integrieren
4. **Favicon erweitern**: Verschiedene Favicon-Größen für alle Geräte
5. **Weitere Sektionen**: Services, Team, Contact-Bereich hinzufügen
6. **Blog-System**: Statisches Blog mit Markdown-Dateien implementieren
7. **Lighthouse-Score**: Performance und Accessibility auf 100% optimieren

## ✅ Completed Features

- ✅ Modulares CSS-System mit komponentenbasierten Styles
- ✅ Responsive Hero-Sektion mit Hintergrundbild-Optimierung
- ✅ Animierte Logo-Sektion mit iframe-basierter Wellenanimation
- ✅ Vollständig funktionale Waitlist mit MailerLite-Integration
- ✅ About-Sektion mit Dark-Background und Overlay
- ✅ Vollständiges Impressum und Datenschutzerklärung
- ✅ Mobile-optimierte Navigation mit Header-Transitions
- ✅ Saubere HTML-Include-Struktur für bessere Wartbarkeit

## 🤝 Contributing

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz veröffentlicht. Siehe `LICENSE` Datei für Details.

---

Built with ❤️ für die Surf-Community
