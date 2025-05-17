import { tool } from 'ai';
import { z } from 'zod';
import { getCurrentTimezone, convertTimeToUTC } from '@/lib/utils';

export const bookMeeting = tool({
  description: 'Book a meeting with Omnipresence. Time should be specified in ISO format (e.g. "2023-06-20T10:00:00") or as a natural language time (e.g. "tomorrow at 2pm", "next Monday at 10am").',
  parameters: z.object({
    start: z.string().describe('The meeting start time in ISO format (e.g., "2023-06-20T10:00:00") or natural language (e.g., "tomorrow at 2pm")'),
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

      // Try to parse the time string
      let start_time;
      try {
        start_time = convertTimeToUTC(start);
      } catch (error) {
        return new Error(`Failed to parse time: ${start}. Please use ISO format (e.g., "2023-06-20T10:00:00") or natural language (e.g., "tomorrow at 2pm").`);
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return new Error(`Cal.com API error: ${response.status} ${response.statusText}${errorData ? ' - ' + JSON.stringify(errorData) : ''}`);
      }

      const bookingData = await response.json();
      return {
        success: true,
        bookingId: bookingData.id,
        message: "Meeting successfully booked!",
        bookingData
      };
    } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
    }
},
});