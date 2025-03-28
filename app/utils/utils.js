// utils.js

export function formatDate(isoDateString) {
    const [year, month, day] = isoDateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  export function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }
  
export function formatDateTime(dateTimeString) {
    const [datePart, timePart] = dateTimeString.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');
  
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  