# Surfmate Website

Eine moderne, modulare Website für Surfmate mit animiertem Logo und sauberer Codestruktur.

## 🌊 Features

- **Modulares CSS-System**: Saubere Trennung von Reset, Variablen, Base-Styles und Komponenten
- **Animiertes Surfmate-Logo**: Smooth Wellenanimation mit SVG und JavaScript
- **Responsive Design**: Mobile-first Ansatz mit flexibler Navigation
- **Performance-optimiert**: Efficient animations mit `requestAnimationFrame`
- **Barrierefreie Navigation**: Screen-reader freundlich mit ARIA-Labels
- **Wartbarer Code**: Modulare JavaScript-Komponenten

## 📁 Projektstruktur

```
surfmate-website/
├── index.html              # Hauptseite mit Hero-Animation
├── impressum.html           # Impressum-Seite
├── datenschutz.html         # Datenschutz-Seite
├── css/
│   ├── main.css            # CSS-Import-Datei
│   ├── reset.css           # CSS Reset
│   ├── variables.css       # CSS Custom Properties
│   ├── base.css            # Base Styles & Typography
│   ├── header.css          # Header & Navigation
│   ├── footer.css          # Footer Styles
│   └── layout.css          # Layout & Sections
├── js/
│   ├── navigation.js       # Mobile Navigation Logic
│   └── wave-animation.js   # Wellenanimation für Logo
└── components/
    └── surfmate-logo.html  # SVG Logo Component
```

## 🎨 CSS-Architektur

### Modulares System

Das CSS ist in logische Module aufgeteilt:

1. **reset.css** - Normalisiert Browser-Standards
2. **variables.css** - CSS Custom Properties für konsistente Werte
3. **base.css** - Grundlegende Styles und Typography
4. **header.css** - Navigation und Header-Komponenten
5. **footer.css** - Footer-Styles
6. **layout.css** - Page-Layouts und Sektionen

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
- Event Handling für Responsive Design

### Wave Animation (wave-animation.js)

- Smooth SVG-Pfad Animation
- Performance-Optimierung mit `requestAnimationFrame`
- Automatic Pause bei Hintergrund-Tab (Batterie-schonend)

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

1. **Favicon erstellen**: SVG-Favicon für moderne Browser
2. **Content erweitern**: Weitere Sektionen für Services, About, Contact
3. **SEO optimieren**: Schema.org Markup, erweiterte Meta-Tags
4. **Performance**: CSS/JS Minification für Production
5. **Analytics**: Google Analytics oder alternative Tracking-Lösung

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
