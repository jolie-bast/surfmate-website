import {defineType} from 'sanity'

export const hero = defineType({
  name: 'hero',
  type: 'document',
  title: 'Hero Section',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Haupttitel',
      description: 'Der große Titel im Hero-Bereich (z.B. "More waves. More moments.")',
      validation: (rule) => rule.required().max(100),
    },
    {
      name: 'subtitle',
      type: 'text',
      title: 'Untertitel',
      description: 'Der beschreibende Text unter dem Haupttitel',
      validation: (rule) => rule.required().max(200),
    },
    {
      name: 'backgroundImage',
      type: 'image',
      title: 'Hintergrundbild',
      description: 'Das große Hintergrundbild für die Hero-Sektion',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt-Text',
          description: 'Beschreibung des Bildes für Barrierefreiheit',
          validation: (rule) => rule.required(),
        },
      ],
      validation: (rule) => rule.required(),
    },
    {
      name: 'isActive',
      type: 'boolean',
      title: 'Aktiv',
      description: 'Soll diese Hero-Sektion angezeigt werden?',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'backgroundImage',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title || 'Hero Section',
        subtitle: subtitle,
        media: media,
      }
    },
  },
})
