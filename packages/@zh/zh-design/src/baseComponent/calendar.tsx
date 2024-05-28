import generateCalendar from 'antd/es/calendar/generateCalendar';
import { Dayjs } from 'dayjs';
import dayjsGenerateConfig from 'rc-picker/es/generate/dayjs';

export const Calendar = generateCalendar<Dayjs>(dayjsGenerateConfig);
