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
    const url = 'https://api.cal.com/v2/bookings';
    let requestBody;

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

      requestBody = {
        eventTypeId: eventTypeId,
        start: start_time, // Using converted UTC time
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

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Cal.com API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(`Cal.com API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      return {
        success: true,
        data: responseData,
        request: {
          url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cal-api-version': '2024-08-13',
          },
          body: requestBody
        }
      };

    } catch (error) {
      console.error('Booking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        request: {
          url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cal-api-version': '2024-08-13',
          },
          body: requestBody
        }
      };
    }
},
});