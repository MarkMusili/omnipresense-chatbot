import { tool } from 'ai';
import { z } from 'zod';
import { getCurrentTimezone, convertTimeToUTC } from '@/lib/utils';

export const bookMeeting = tool({
  description: 'Book a meeting with Omnipresence',
  parameters: z.object({
    start: z.string().describe('The meeting start time (e.g., "2023-06-20T10:00:00" or "10 AM tomorrow")'),
    name: z.string().describe('Name of the person booking the meeting'),
    email: z.string().describe('Email of the person booking the meeting'),
  }),
  execute: async ({ start, name, email}) => {
    try {
      const api_key = process.env.CAL_API_KEY;
      const event_type_id = process.env.CAL_EVENT_TYPE_ID;

      if (!api_key) {
        throw new Error('CAL_API_KEY is not set in environment variables');
      }

      if (!event_type_id) {
        throw new Error('CAL_EVENT_TYPE_ID is not set in environment variables');
      }


      const eventTypeId = process.env.CAL_EVENT_TYPE_ID;

      const converted_timezone = getCurrentTimezone() || "Africa/Nairobi";

      const start_time = convertTimeToUTC(start);

      const url = 'https://api.cal.com/v2/bookings';

      const requestBody = {
        eventTypeId: eventTypeId,
        start: start,
        attendee: {
          name: name,
          email: email,
          timeZone: converted_timezone,
          language: 'en'
        },
      };

      console.log('Cal.com API Request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13',
          'Authorization': `Bearer ${api_key}`,
        },
        body: JSON.stringify(requestBody),
      });

      return response.text();
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
},
});