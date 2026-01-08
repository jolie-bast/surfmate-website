import {defineType} from 'sanity'

export const about = defineType({
  name: 'about',
  type: 'document',
  title: 'About Section',
  fields: [
    {
      name: 'mainSection',
      type: 'object',
      title: 'Hauptsektion',
      description: 'Die erste About-Sektion mit hellem Hintergrund',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Titel',
          description: 'Haupttitel der About-Sektion (z.B. "What is Surfmate?")',
          validation: (rule) => rule.required().max(100),
        },
        {
          name: 'content',
          type: 'array',
          title: 'Inhalt',
          description: 'Der Textinhalt der Hauptsektion',
          of: [
            {
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'H3', value: 'h3'},
                {title: 'H4', value: 'h4'},
              ],
              marks: {
                decorators: [
                  {title: 'Fett', value: 'strong'},
                  {title: 'Kursiv', value: 'em'},
                ],
              },
            },
          ],
          validation: (rule) => rule.required(),
        },
      ],
      validation: (rule) => rule.required(),
    },
    {
      name: 'darkSection',
      type: 'object',
      title: 'Dunkle Sektion',
      description: 'Die zweite About-Sektion mit dunklem Hintergrund und Surf-Bild',
      fields: [
        {
          name: 'headline',
          type: 'string',
          title: 'Überschrift',
          description: 'Die emotionale Überschrift in der dunklen Sektion',
          validation: (rule) => rule.required().max(150),
        },
        {
          name: 'content',
          type: 'array',
          title: 'Inhalt',
          description: 'Der Textinhalt der dunklen Sektion',
          of: [
            {
              type: 'block',
              styles: [{title: 'Normal', value: 'normal'}],
              marks: {
                decorators: [
                  {title: 'Fett', value: 'strong'},
                  {title: 'Kursiv', value: 'em'},
                ],
              },
            },
          ],
          validation: (rule) => rule.required(),
        },
        {
          name: 'backgroundImage',
          type: 'image',
          title: 'Hintergrundbild',
          description: 'Das Hintergrundbild für die dunkle Sektion (optional)',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt-Text',
              description: 'Beschreibung des Bildes für Barrierefreiheit',
            },
          ],
        },
      ],
      validation: (rule) => rule.required(),
    },
    {
      name: 'isActive',
      type: 'boolean',
      title: 'Aktiv',
      description: 'Soll diese About-Sektion angezeigt werden?',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'mainSection.title',
      subtitle: 'darkSection.headline',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'About Section',
        subtitle: subtitle,
      }
    },
  },
})
