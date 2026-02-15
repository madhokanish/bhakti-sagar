export type LiveMandir = {
  id: string;
  name: string;
  location: string;
  channelUrl: string;
  channelId?: string;
  thumbnail: string;
};

export const liveMandirs: LiveMandir[] = [
  {
    id: "jhandewala-devi-mandir",
    name: "Jhandewalan Devi Mandir",
    location: "New Delhi, India",
    channelUrl: "https://www.youtube.com/@jhandewaladevimandirofficial",
    thumbnail: "/category/shakti.jpg"
  },
  {
    id: "thyagaraj-jagannath-mandir",
    name: "Thyagraj Nagar Jagannath Mandir",
    location: "New Delhi, India",
    channelUrl: "https://www.youtube.com/@ThyagrajNagar_JagannathMandir",
    thumbnail: "/category/krishna.jpg"
  },
  {
    id: "neelkanth-temple",
    name: "Neelkanth Temple",
    location: "Rishikesh, India",
    channelUrl: "https://www.youtube.com/@NeelkanthTemple/videos",
    thumbnail: "/category/shiva.jpg"
  },
  {
    id: "sai-mandir-noida",
    name: "Sai Mandir Noida",
    location: "Noida, India",
    channelUrl: "https://www.youtube.com/@saimandirnoida",
    thumbnail: "/category/other.webp"
  },
  {
    id: "gdw-mandir",
    name: "GDW Mandir",
    location: "India",
    channelUrl: "https://www.youtube.com/@Gdw-34",
    thumbnail: "/category/other.webp"
  },
  {
    id: "baba-harihar-nath",
    name: "Baba Harihar Nath",
    location: "India",
    channelUrl: "https://www.youtube.com/@BabaHariharNath",
    thumbnail: "/category/other.webp"
  },
  {
    id: "koradi-temple",
    name: "Koradi Temple",
    location: "Nagpur, India",
    channelUrl: "https://www.youtube.com/@KoradiTemple",
    thumbnail: "/category/shakti.jpg"
  },
  {
    id: "somnath-temple",
    name: "Somnath Temple Official",
    location: "Prabhas Patan, India",
    channelUrl: "https://www.youtube.com/@SomnathTempleOfficialChannel/featured",
    thumbnail: "/category/shiva.jpg"
  },
  {
    id: "iskcon-vrndavan",
    name: "ISKCON Vrindavan",
    location: "Vrindavan, India",
    channelUrl: "https://www.youtube.com/@ISKCONVrndavan/videos",
    thumbnail: "/category/krishna.jpg"
  },
  {
    id: "ucuxwN78ElYEiHBbbR05bV7g",
    name: "Temple Channel UCuxw",
    location: "India",
    channelUrl: "https://www.youtube.com/channel/UCuxwN78ElYEiHBbbR05bV7g",
    channelId: "UCuxwN78ElYEiHBbbR05bV7g",
    thumbnail: "/category/other.webp"
  },
  {
    id: "ucsof6uS83aCrckdJtvMmxnw",
    name: "Temple Channel UCsOF",
    location: "India",
    channelUrl: "https://www.youtube.com/channel/UCsOF6uS83aCrckdJtvMmxnw",
    channelId: "UCsOF6uS83aCrckdJtvMmxnw",
    thumbnail: "/category/other.webp"
  },
  {
    id: "svbc-ttd-live-tv",
    name: "SVBC TTD Live TV",
    location: "Tirupati, India",
    channelUrl: "https://www.youtube.com/@svbcttdlivetv/featured",
    thumbnail: "/category/vishnu.jpg"
  }
];

export function getLiveMandirs() {
  return liveMandirs;
}

export function getLiveMandirById(id: string) {
  return liveMandirs.find((mandir) => mandir.id === id);
}
