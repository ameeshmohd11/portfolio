import type { BearData } from "~/types";

const bear: BearData[] = [
  {
    id: "profile",
    title: "Profile",
    icon: "i-fa-solid:paw",
    md: [
      {
        id: "about-me",
        title: "About Me",
        file: "markdown/about-me.md",
        icon: "i-la:dragon",
        excerpt: "Hey there! I'm a dragon lost in human world..."
      },
      {
        id: "github-stats",
        title: "Github Stats",
        file: "markdown/github-stats.md",
        icon: "i-icon-park-outline:github",
        excerpt: "Here are some status about my github account..."
      },
      {
        id: "about-site",
        title: "About This Site",
        file: "markdown/about-site.md",
        icon: "i-octicon:browser",
        excerpt: "Something about this personal portfolio site..."
      }
    ]
  },
  {
    id: "project",
    title: "Projects",
    icon: "i-octicon:repo",
    md: [
      {
        id: "datedrop",
        title: "DateDrop",
        file: "markdown/datedrop.md",
        icon: "i-ri:folder-shared-fill",
        excerpt: "Datedrop for making folders of docs into specific folders...",
        link: "https://github.com/ameeshmohd11/Datedrop"
      },
      {
        id: "athan-app",
        title: "Athan App",
        file: "markdown/athan-app.md",
        icon: "i-ri:time-line",
        excerpt: "Athan desktop application for prayer calculation and alerts...",
        link: "https://github.com/ameeshmohd11/athan-app"
      },
      {
        id: "neoincugr9",
        title: "Neonatal Smart Incubator",
        file: "markdown/neoincugr9.md",
        icon: "i-fa-solid:heartbeat",
        excerpt: "Smart IoT-enabled incubator monitoring system for infant vitals...",
        link: "https://github.com/ameeshmohd11/neoincugr9"
      },
      {
        id: "sentinelx",
        title: "SentinelX",
        file: "markdown/sentinelx.md",
        icon: "i-fa-solid:shield-alt",
        excerpt: "Real-time crisis alert and emergency response system for Android...",
        link: "https://github.com/ameeshmohd11/sentinelx"
      },
      {
        id: "chest-xray-covid-pneumonia-detection",
        title: "Chest X-Ray COVID/Pneumonia",
        file: "https://raw.githubusercontent.com/ameeshmohd11/chest-xray-covid-pneumonia-detection/master/README.md",
        icon: "i-ri:health-book-line",
        excerpt: "CNN-based classification of chest X-rays using Transfer Learning...",
        link: "https://github.com/ameeshmohd11/chest-xray-covid-pneumonia-detection"
      },
      {
        id: "chrome-productivity-tracker-ext",
        title: "Chrome Productivity Tracker",
        file: "https://raw.githubusercontent.com/ameeshmohd11/Chrome-productivity-tracker-ext/master/README.md",
        icon: "i-octicon:browser",
        excerpt: "Built a lightweight, privacy-first browser extension to track web activity...",
        link: "https://github.com/ameeshmohd11/Chrome-productivity-tracker-ext"
      },
      {
        id: "face-drive",
        title: "Face Drive",
        file: "https://raw.githubusercontent.com/ameeshmohd11/Face-Drive/main/README.md",
        icon: "i-ri:camera-3-line",
        excerpt: "Face-controlled navigation and gesture interaction system...",
        link: "https://github.com/ameeshmohd11/Face-Drive"
      }
    ]
  }
];

export default bear;
