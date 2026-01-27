import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize user-provided HTML (bio, descriptions, comments, etc.)
 *
 * - Prevents XSS
 * - Allows basic formatting
 * - Strips dangerous tags & attributes
 */
export function sanitizeUserHtml(input: string): string {
  if (!input) {
    return '';
  }

  return sanitizeHtml(input, {
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
    ],

    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },

    allowedSchemes: ['http', 'https', 'mailto'],

    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },

    disallowedTagsMode: 'discard',
  });
}
