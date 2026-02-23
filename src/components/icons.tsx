import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2" {...props}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M16 8C16 6.66 15.24 5.46 14.1 4.78C13.69 4.5 13.23 4.28 12.75 4.14C12.75 4.14 12.63 3.93 12.5 3.75C12.23 3.33 11.77 3.33 11.5 3.75C11.37 3.93 11.25 4.14 11.25 4.14C10.77 4.28 10.31 4.5 9.9 4.78C8.76 5.46 8 6.66 8 8C8 9.34 8.76 10.54 9.9 11.22C10.31 11.5 10.77 11.72 11.25 11.86V16.5C11.25 16.5 10.88 18.75 10.5 19.5C10.13 20.25 10.5 21 11.25 21H12.75C13.5 21 13.88 20.25 13.5 19.5C13.13 18.75 12.75 16.5 12.75 16.5V11.86C13.23 11.72 13.69 11.5 14.1 11.22C15.24 10.54 16 9.34 16 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.5 5.5L8.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.5 5.5L15.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-headline text-xl font-bold text-foreground">OnlyHunts</span>
    </div>
  );
}
