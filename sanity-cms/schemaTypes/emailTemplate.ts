import {defineType} from 'sanity'

export const emailTemplate = defineType({
  name: 'emailTemplate',
  type: 'document',
  title: 'Email Template',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Template Name',
      description: 'Name für das Email-Template (z.B. "Newsletter", "Welcome Email")',
      validation: (rule) => rule.required(),
    },
    {
      name: 'subject',
      type: 'string',
      title: 'Email Subject',
      description: 'Standard-Betreff für diese Art von Email',
    },
    {
      name: 'logo',
      type: 'image',
      title: 'Logo',
      description: 'Logo für den Email-Header',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Alternativer Text für das Logo',
        },
      ],
    },
    {
      name: 'headerImage',
      type: 'image',
      title: 'Header Bild',
      description: 'Optionales Header-Bild neben oder unter dem Logo',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Alternativer Text für das Header-Bild',
        },
      ],
    },
    {
      name: 'brandColor',
      type: 'string',
      title: 'Brand Color',
      description: 'Hauptfarbe für das Email-Template (Hex-Code z.B. #3b82f6)',
      validation: (rule) =>
        rule
          .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
          .error('Bitte gib einen gültigen Hex-Code ein (z.B. #3b82f6)'),
    },
    {
      name: 'contentImage',
      type: 'image',
      title: 'Content Bild',
      description: 'Bild für den Hauptinhalt der Email',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Alternativer Text für das Content-Bild',
        },
      ],
    },
    {
      name: 'templateType',
      type: 'string',
      title: 'Template Type',
      description: 'Art des Email-Templates',
      options: {
        list: [
          {title: 'Newsletter', value: 'newsletter'},
          {title: 'Welcome Email', value: 'welcome'},
          {title: 'Product Update', value: 'product-update'},
          {title: 'Announcement', value: 'announcement'},
          {title: 'Custom', value: 'custom'},
        ],
      },
      validation: (rule) => rule.required(),
    },
    {
      name: 'defaultGreeting',
      type: 'string',
      title: 'Standard Begrüßung',
      description: 'Standard-Begrüßungstext (falls kein Vorname vorhanden)',
      initialValue: 'Surf-Enthusiast',
    },
    {
      name: 'footerText',
      type: 'text',
      title: 'Footer Text',
      description: 'Text für den Footer der Email',
      rows: 3,
    },
    {
      name: 'isActive',
      type: 'boolean',
      title: 'Aktiv',
      description: 'Ist dieses Template aktiv und verwendbar?',
      initialValue: true,
    },
    {
      name: 'previewText',
      type: 'string',
      title: 'Preview Text',
      description: 'Text der in Email-Clients als Vorschau angezeigt wird',
      validation: (rule) => rule.max(140).warning('Preview Text sollte unter 140 Zeichen sein'),
    },
  ],
  preview: {
    select: {
      title: 'title',
      templateType: 'templateType',
      logo: 'logo',
      isActive: 'isActive',
    },
    prepare({title, templateType, logo, isActive}) {
      return {
        title: title,
        subtitle: `${templateType} ${isActive ? '✅' : '❌'}`,
        media: logo,
      }
    },
  },
})
