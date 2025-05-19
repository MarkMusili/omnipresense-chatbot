import { tool } from 'ai';
import { z } from 'zod';
import { getCurrentTimezone, convertTimeToUTC } from '@/lib/utils';

// List of common personal email domains to reject
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'live.com',
  'msn.com',
  'me.com',
  'inbox.com'
];

// Function to validate if the email is from a company domain
const isCompanyEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !PERSONAL_EMAIL_DOMAINS.includes(domain);
};

export const bookMeeting = tool({
  description: 'Book a meeting with Omnipresence',
  parameters: z.object({
    start: z.string().describe('The meeting start time in ISO 8601 format (e.g., "2023-06-20T10:00:00")'),
    name: z.string().describe('Name of the person booking the meeting'),
    email: z.string().describe('Email of the person booking the meeting'),
  }),
  execute: async ({ start, name, email}) => {
    try {
      // Validate that the email is from a company domain
      if (!isCompanyEmail(email)) {
        return {
          success: false,
          error: 'Sorry, we only accept company email addresses for booking meetings. Please use your work email.',
        };
      }

      const api_key = process.env.CAL_API_KEY;
      const event_type_id = process.env.CAL_EVENT_TYPE_ID;

      if (!api_key) {
        throw new Error('CAL_API_KEY is not set in environment variables');
      }

      if (!event_type_id) {
        throw new Error('CAL_EVENT_TYPE_ID is not set in environment variables');
      }

      const eventTypeId = parseInt(process.env.CAL_EVENT_TYPE_ID || '0');

      const converted_timezone = getCurrentTimezone() || "Africa/Nairobi";

      // Convert time to UTC ISO 8601 format
      let start_time;
      try {
        start_time = convertTimeToUTC(start);
      } catch (error) {
        return {
          success: false,
          error: `Invalid time format. Please provide time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS).`,
          details: error instanceof Error ? error.message : String(error)
        };
      }

      const requestBody = {
        eventTypeId: eventTypeId,
        start: start_time,
        attendee: {
          name: name,
          email: email,
          timeZone: converted_timezone,
          language: 'en'
        },
      };

      console.log('Cal.com API Request:', JSON.stringify(requestBody, null, 2));

      const url = 'https://api.cal.com/v2/bookings';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13',
          'Authorization': `Bearer ${api_key}`,
        },
        body: JSON.stringify(requestBody),
      });

    const data = await response.text();
    return data;
    } catch (error: unknown) {
        const err = error instanceof Error ? error : String(error);
        return err.toString();
    }
},
});