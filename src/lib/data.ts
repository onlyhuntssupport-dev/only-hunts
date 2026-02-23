import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id) as ImagePlaceholder;

export const outfitters = [
  {
    id: '1',
    name: 'Kalahari Precision Safaris',
    location: 'Northern Cape, South Africa',
    rating: 4.8,
    reviewsCount: 28,
    description: 'Specializing in plains game hunting in the stunning Kalahari desert. Our experienced professional hunters and trackers ensure a challenging and rewarding experience. We pride ourselves on ethical hunting and superior trophy quality.',
    images: [
      getImage('outfitter-camp'),
      getImage('outfitter-gallery-1'),
      getImage('outfitter-gallery-2'),
      getImage('outfitter-gallery-3'),
    ],
    amenities: ['Luxury Lodging', 'Gourmet Meals', 'Airport Transfer', 'Trophy Preparation', 'Wi-Fi'],
  },
  {
    id: '2',
    name: 'Limpopo Big Game Outfitters',
    location: 'Limpopo Province, South Africa',
    rating: 4.9,
    reviewsCount: 42,
    description: 'Located in the heart of Big 5 country, we offer unparalleled dangerous game and plains game hunting. Our vast concessions are unfenced and teeming with wildlife, providing a truly wild African safari.',
    images: [
      getImage('outfitter-gallery-1'),
      getImage('outfitter-camp'),
      getImage('outfitter-gallery-3'),
      getImage('outfitter-gallery-2'),
    ],
    amenities: ['Thatched Chalets', 'Professional Trackers', '4x4 Game Drives', 'Rifle Hire', 'Taxidermy Services'],
  },
  {
    id: '3',
    name: 'Eastern Cape Highlands Hunts',
    location: 'Eastern Cape, South Africa',
    rating: 4.6,
    reviewsCount: 19,
    description: 'Hunt the diverse terrain of the Eastern Cape, from coastal forests to rugged mountains. We offer a wide variety of unique species and tailor-made packages for both rifle and bow hunters.',
    images: [
      getImage('outfitter-gallery-2'),
      getImage('outfitter-gallery-3'),
      getImage('outfitter-camp'),
      getImage('outfitter-gallery-1'),
    ],
    amenities: ['Farmhouse Accommodation', 'Bow Hunting Blinds', 'Family Friendly', 'Photographic Safaris'],
  },
];

export const hunts = [
  {
    id: '101',
    outfitterId: '1',
    title: 'Kalahari Gemsbok & Springbok Package',
    species: ['Gemsbok', 'Springbok'],
    price: 4500,
    duration: '7 Days',
    type: 'Rifle',
    image: getImage('kudu-hunt'),
    description: 'A classic Kalahari hunt focusing on the iconic Gemsbok and abundant Springbok. Experience long-range shooting in a breathtaking landscape.'
  },
  {
    id: '102',
    outfitterId: '2',
    title: 'Limpopo Kudu & Impala Hunt',
    species: ['Kudu', 'Impala', 'Warthog'],
    price: 5200,
    duration: '8 Days',
    type: 'Rifle/Bow',
    image: getImage('springbok-hunt'),
    description: 'Pursue the legendary "Grey Ghost" of Africa, the Greater Kudu, in the thick bush of the Limpopo valley. A thrilling walk-and-stalk adventure.'
  },
  {
    id: '103',
    outfitterId: '1',
    title: 'Desert Predator Hunt',
    species: ['Black-backed Jackal', 'Caracal'],
    price: 3800,
    duration: '5 Days',
    type: 'Rifle',
    image: getImage('wildebeest-hunt'),
    description: 'A specialized hunt focusing on the elusive predators of the Kalahari. Primarily conducted at night, this is a hunt for the patient and skilled marksman.'
  },
  {
    id: '104',
    outfitterId: '3',
    title: 'Eastern Cape Spiral Horn Slam',
    species: ['Cape Bushbuck', 'Kudu', 'Eland'],
    price: 8500,
    duration: '10 Days',
    type: 'Rifle',
    image: getImage('impala-hunt'),
    description: 'A challenging hunt across varied terrain for three of Africa\'s most beautiful spiral-horned antelope. A true collector\'s safari.'
  },
];

export const reviews = [
  {
    id: 'r1',
    outfitterId: '1',
    hunterName: 'John D.',
    hunterCountry: 'USA',
    rating: 5,
    date: 'October 2023',
    comment: 'Unforgettable experience with Kalahari Precision Safaris. The PH was incredibly knowledgeable, and the camp was first-class. The hunting was tough but fair, and I came away with magnificent trophies. Highly recommended.'
  },
  {
    id: 'r2',
    outfitterId: '1',
    hunterName: 'Markus S.',
    hunterCountry: 'Germany',
    rating: 4,
    date: 'September 2023',
    comment: 'Very good hunt. The landscape is amazing. Food was excellent. Lost a star because one of the vehicles had some issues, but it was resolved quickly. I will be back for a Kudu.'
  },
  {
    id: 'r3',
    outfitterId: '2',
    hunterName: 'Bill T.',
    hunterCountry: 'Canada',
    rating: 5,
    date: 'August 2023',
    comment: 'If you want a real African adventure, this is the place. Saw big game every day. The staff at Limpopo Big Game are true professionals. My buffalo hunt was the most thrilling week of my life.'
  },
   {
    id: 'r4',
    outfitterId: '2',
    hunterName: 'Peter J.',
    hunterCountry: 'Australia',
    rating: 5,
    date: 'July 2023',
    comment: 'From start to finish, a top-notch operation. The attention to detail is incredible. The trackers are some of the best I have ever seen. Will be returning with my son next year.'
  },
];

export const dashboardData = {
  stats: [
    { label: 'Total Inquiries', value: '128' },
    { label: 'Pending Responses', value: '12' },
    { label: 'Confirmed Bookings (Year)', value: '34' },
    { label: 'Profile Views (Month)', value: '2,430' },
  ],
  recentInquiries: [
    { id: 'I001', hunterName: 'James H.', hunt: 'Kalahari Gemsbok', date: '2 days ago', status: 'Pending' },
    { id: 'I002', hunterName: 'Liam O\'Connell', hunt: 'Limpopo Kudu', date: '4 days ago', status: 'Responded' },
    { id: 'I003', hunterName: 'Sven G.', hunt: 'Desert Predator', date: '1 week ago', status: 'Responded' },
    { id: 'I004', hunterName: 'Carlos R.', hunt: 'Eastern Cape Slam', date: '2 weeks ago', status: 'Booked' },
  ],
  inquiriesChart: [
    { month: 'Jan', inquiries: 6 },
    { month: 'Feb', inquiries: 8 },
    { month: 'Mar', inquiries: 15 },
    { month: 'Apr', inquiries: 12 },
    { month: 'May', inquiries: 18 },
    { month: 'Jun', inquiries: 21 },
  ]
};
