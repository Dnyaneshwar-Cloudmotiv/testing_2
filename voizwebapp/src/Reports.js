import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import "./Reports.css"; // Make sure to import your existing CSS file
import * as XLSX from "xlsx";

const Reports = () => {
  const [userData, setUserData] = useState([]);
  const [rawApiData, setRawApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "2024-11-01",
    endDate: "2025-03-05",
  });
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [dailyActiveUsers, setDailyActiveUsers] = useState([]);
  const [userCreationData, setUserCreationData] = useState([]);
  const [monthlyActivityData, setMonthlyActivityData] = useState([]);
  const [deviceData, setDeviceData] = useState(null);

  const parseActivityDate = (day, month, year) => {
    // Make sure all parts are treated as integers and create UTC date
    return new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
    );
  };

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateSong, setDateSong] = useState({
    startDate: "2025-05-01", // Always set to May 1, 2025
    endDate: getCurrentDate()
  });

  const [songData, setSongData] = useState([]);

  // New function to fetch device data from API
  const fetchDeviceData = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_user_device_details"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Device Reports");
      }
      const data = await response.json();
      console.log("Device data:", data);

      // Store the device data
      setDeviceData(data);

      // Export the data immediately
      exportDeviceData(data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching device data:", error);
      setLoading(false);
      alert("Error fetching device data: " + error.message);
    }
  };

  const handleSongDateChange = (e, dateType) => {
    const newValue = e.target.value;
    const currentDate = getCurrentDate();
    
    // Prevent any date from being greater than current date
    if (newValue > currentDate) {
      alert(`${dateType === 'startDate' ? 'Start' : 'End'} date cannot be greater than current date`);
      return;
    }
    
    if (dateType === 'endDate') {
      // Make sure end date is not before start date
      if (newValue < dateSong.startDate) {
        alert('End date cannot be before start date');
        return;
      }
      
      setDateSong({ ...dateSong, endDate: newValue });
    } else if (dateType === 'startDate') {
      // Make sure start date is not after end date
      if (newValue > dateSong.endDate) {
        // Option 1: Adjust end date to match start date
        setDateSong({ startDate: newValue, endDate: newValue });
        // Option 2: Prevent the change (uncomment this instead if preferred)
        // alert('Start date cannot be after end date');
        // return;
      } else {
        setDateSong({ ...dateSong, startDate: newValue });
      }
    }
  };

// Updated fetchSingerSongDetails function to fetch all data and filter client-side
const fetchSingerSongDetails = async () => {
  setLoading(true);
  try {
    console.log(`Fetching song details for date range: ${dateSong.startDate} to ${dateSong.endDate}`);
    
    // Fetch all song data without date parameters
    const response = await fetch(
      "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/getSingerSongDailyDetails"
    );
    if (!response.ok) {
      throw new Error('Failed to fetch Singer Song Details');
    }
    const data = await response.json();
    console.log('Singer Song Details (raw) count:', data.songs.length);
    
    // Filter songs based on the selected date range
    const filteredSongs = filterSongsByDateRange(data.songs, dateSong.startDate, dateSong.endDate);
    console.log('Filtered Song Details count:', filteredSongs.length);
    
    // Add date range play count directly to the filtered songs
    const songsWithRangeCounts = filteredSongs.map(song => {
      const dateRangePlayCount = calculatePlayCountInDateRange(song, dateSong.startDate, dateSong.endDate);
      console.log(`Song ID: ${song.song_id}, Name: ${song.songName}, Date Range Count: ${dateRangePlayCount}`);
      
      return {
        ...song,
        dateRangePlayCount
      };
    });
    
    // Set the enhanced song data to state
    setSongData(songsWithRangeCounts);
    
    // Export the filtered data immediately (only if there are songs to export)
    if (filteredSongs.length > 0) {
      exportSongData(filteredSongs, dateSong.startDate, dateSong.endDate);
    } else {
      alert("No song data found for the selected date range.");
    }
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching singer song details:', error);
    setLoading(false);
    alert('Error fetching singer song details: ' + error.message);
  }
};

// Improved function to filter songs by date range
const filterSongsByDateRange = (songs, startDateStr, endDateStr) => {
  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    return [];
  }
  
  // Convert input date strings to Date objects for comparison
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  endDate.setHours(23, 59, 59); // Set to end of day
  
  console.log(`Filtering songs from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  return songs.filter(song => {
    // Check if the song has play data within the date range
    let hasPlayInRange = false;
    
    // Iterate through all month/year keys (like "Apr 2025")
    Object.keys(song).forEach(key => {
      // Check if this is a month/year key
      if (key.match(/[A-Za-z]{3}\s\d{4}/)) {
        const monthData = song[key];
        
        // Check each day in the month
        if (monthData && typeof monthData === 'object') {
          Object.keys(monthData).forEach(dayKey => {
            // Skip if not in DD/MM/YYYY format
            if (!dayKey.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
              return;
            }
            
            // Parse the date from the day key (format: "DD/MM/YYYY")
            const [day, month, year] = dayKey.split('/');
            
            // Create date from parts
            try {
              const playDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
              
              // Check if this play date falls within our date range
              if (!isNaN(playDate.getTime()) && playDate >= startDate && playDate <= endDate) {
                hasPlayInRange = true;
              }
            } catch (error) {
              console.warn(`Invalid date format: ${dayKey}`, error);
            }
          });
        }
      }
    });
    
    return hasPlayInRange;
  });
};

// Function to calculate play count within a date range for a single song
const calculatePlayCountInDateRange = (song, startDateStr, endDateStr) => {
  if (!song) return 0;
  
  // Convert input date strings to Date objects for comparison
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  endDate.setHours(23, 59, 59); // Set to end of day
  
  let totalCount = 0;
  
  // Iterate through all month/year keys (like "Apr 2025")
  Object.keys(song).forEach(key => {
    // Check if this is a month/year key
    if (key.match(/[A-Za-z]{3}\s\d{4}/)) {
      const monthData = song[key];
      
      // Check each day in the month
      if (monthData && typeof monthData === 'object') {
        Object.keys(monthData).forEach(dayKey => {
          // Skip if not in DD/MM/YYYY format
          if (!dayKey.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            return;
          }
          
          // Parse the date from the day key (format: "DD/MM/YYYY")
          const [day, month, year] = dayKey.split('/');
          
          // Create date from parts
          try {
            const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const playDate = new Date(dateStr);
            
            // Check if this play date falls within our date range
            if (!isNaN(playDate.getTime()) && playDate >= startDate && playDate <= endDate) {
              const countN = parseInt(monthData[dayKey].N || "0");
              totalCount += countN;
            }
          } catch (error) {
            console.warn(`Invalid date format: ${dayKey}`, error);
          }
        });
      }
    }
  });
  
  return totalCount;
};

// Function to export song data as CSV/Excel
// const exportSongData = (songs) => {
//   if (!songs || songs.length === 0) {
//     alert("No song data available to export for the selected date range.");
//     return;
//   }

//   // Create a new workbook
//   const wb = XLSX.utils.book_new();

//   // Prepare song data for export
//   const songExportData = songs.map(song => ({
//     "User ID": song.user_id || "",
//     "Artist Name": song.full_name || "",
//     "Song ID": song.song_id || "",
//     "Song Name": song.songName || "",
//     "Total Play Count": song.totalPlayCount || "0",
//     // You can uncomment these if needed
//     //"Last Played": song.lastPlayed || "",
//     //"Created": song.created || ""
//   }));

//   // Create worksheet
//   const ws = XLSX.utils.json_to_sheet(songExportData);
  
//   // Add worksheet to workbook
//   XLSX.utils.book_append_sheet(wb, ws, "Song Data");

//   // Export the workbook
//   XLSX.writeFile(
//     wb,
//     `song_play_data_${dateSong.startDate}_to_${dateSong.endDate}.xlsx`
//   );
// };

// Function to export song data as CSV
const exportSongData = (songs, startDateStr, endDateStr) => {
  if (!songs || songs.length === 0) {
    alert("No song data available to export for the selected date range.");
    return;
  }

  console.log("Starting song data export with date range calculation");
  console.log(`Date range: ${startDateStr} to ${endDateStr}`);

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Prepare song data for export with date range calculation
  const songExportData = songs.map(song => {
    // Calculate play count within the date range
    const dateRangePlayCount = calculatePlayCountInDateRange(song, startDateStr, endDateStr);
    
    console.log(`Song: ${song.songName}, Total: ${song.totalPlayCount}, Date Range: ${dateRangePlayCount}`);
    
    return {
      "User ID": song.user_id || "",
      "Artist Name": song.full_name || "",
      "Song ID": song.song_id || "",
      "Song Name": song.songName || "",
      "Total Play Count": song.totalPlayCount || "0",
      "Streams Count": dateRangePlayCount.toString(),
      "Date Range": `${startDateStr} to ${endDateStr}`
    };
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(songExportData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Song Data");

  // Export the workbook
  XLSX.writeFile(
    wb,
    `song_play_data_${startDateStr}_to_${endDateStr}.xlsx`
  );
  
  console.log("Song data export complete");
};

  // Function to export device data as CSV
  // const exportDeviceData = (data) => {
  //   if (!data || !data.users || data.users.length === 0) {
  //     alert('No device data available.');
  //     return;
  //   }

  //   // Create CSV header
  //   let csvContent = 'user_id,Signup_with,EmailId,lastLogin\n';

  //   // Add data rows
  //   data.users.forEach(user => {
  //     // Escape fields that might contain commas
  //     const emailId = user.EmailId ? `"${user.EmailId.replace(/"/g, '""')}"` : '""';
  //     const device  = user.device ? `"${user.device.replace(/"/g, '""')}"` : '""';
  //     const lastLogin = user.lastLogin ? `"${user.lastLogin.replace(/"/g, '""')}"` : '""';

  //     csvContent += `${user.user_id || ''},${device},${emailId},${lastLogin}\n`;
  //   });

  //   // Create a Blob with the CSV content
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  //   // Create a download link and trigger the download
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', `device_report_${new Date().toISOString().split('T')[0]}.csv`);
  //   link.style.visibility = 'hidden';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  // Function to export device data as CSV
const exportDeviceData = (data) => {
  if (!data || !data.users || data.users.length === 0) {
    alert("No device data available.");
    return;
  }

  // Filter users to only include those with a valid FullName
  const filteredUsers = data.users.filter(user => {
    const fullName = user.FullName || "";
    return fullName.trim() !== "";
  });

  if (filteredUsers.length === 0) {
    alert("No user data available with valid Full Name.");
    return;
  }

  // Create CSV header with the requested sequence
  let csvContent =
    "user_id,FullName,StageName,Category,Gender,Age,EmailId,PhoneNumber,registrationDate,createdTimestamp,updatedTimestamp,Signup_with,lastLogin\n";

  // Helper function to safely convert values to strings and escape them for CSV
  const safeString = (value) => {
    if (value === null || value === undefined) return '""';

    // Handle the case where StageName is an object with S property
    if (typeof value === "object" && value !== null) {
      if (value.S !== undefined) {
        value = value.S;
      } else {
        value = JSON.stringify(value);
      }
    }

    // Convert to string and escape quotes
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  // Add data rows
  filteredUsers.forEach((user) => {
    // Process each field with the safeString helper in the requested sequence
    const userId = user.user_id || "";
    const fullName = safeString(user.FullName);
    const stageName = safeString(user.StageName);
    const category = safeString(user.Category);
    const gender = safeString(user.Gender);
    const age = user.Age || "";
    const emailId = safeString(user.EmailId);
    const phoneNumber = safeString(user.PhoneNumber);
    const regDate = safeString(user.registrationDate);
    const createdTime = safeString(user.createdTimestamp);
    const updatedTime = safeString(user.updatedTimestamp);
    const device = safeString(user.device);
    const lastLogin = safeString(user.lastLogin);

    csvContent += `${userId},${fullName},${stageName},${category},${gender},${age},${emailId},${phoneNumber},${regDate},${createdTime},${updatedTime},${device},${lastLogin}\n`;
  });

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a download link and trigger the download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `user_details_report_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // Fetch data from API
  const fetchAllReports = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_all_userData"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch All Reports");
      }
      const data = await response.json();
      console.log(data);

      // Store the raw API response for export functionality
      setRawApiData(data);

      // Process the fetched data
      processUserData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const processUserData = (data) => {
    if (!data || !data.users) return;
  
    const users = data.users;
    setUserData(users);
  
    // Convert date strings to UTC dates to avoid timezone issues
    const startDate = new Date(
      Date.UTC(
        parseInt(dateRange.startDate.split("-")[0]),
        parseInt(dateRange.startDate.split("-")[1]) - 1,
        parseInt(dateRange.startDate.split("-")[2])
      )
    );
  
    const endDate = new Date(
      Date.UTC(
        parseInt(dateRange.endDate.split("-")[0]),
        parseInt(dateRange.endDate.split("-")[1]) - 1,
        parseInt(dateRange.endDate.split("-")[2]),
        23,
        59,
        59 // Set to end of day
      )
    );
  
    // Filter for active users within the date range
    const activeUsersInRange = users.filter((user) => {
      let hasActivityInRange = false;
  
      const monthYearKeys = Object.keys(user).filter((key) =>
        /[A-Za-z]{3}\s\d{4}/.test(key)
      );
  
      monthYearKeys.forEach((monthYear) => {
        if (user[monthYear] && user[monthYear].M) {
          Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
            const [day, monthStr, yearStr] = dayKey.split("/");
            // Use the consistent date parsing function
            const dateObj = parseActivityDate(day, monthStr, yearStr);
  
            if (
              dateObj >= startDate &&
              dateObj <= endDate &&
              parseInt(value.N) > 0
            ) {
              hasActivityInRange = true;
            }
          });
        }
      });
  
      return hasActivityInRange;
    });
  
    // Further filter to only include users with a valid Full Name
    const activeUsers = activeUsersInRange.filter(user => {
      const fullName = user.FullName || "";
      return fullName.trim() !== "";
    });
  
    // Set the count of active users with valid Full Name
    setActiveUsersCount(activeUsers.length);
  
    // Also update date handling in other function calls
    // For daily active users graph, we should also only count users with a Full Name
    const dailyData = generateDailyActivityData(activeUsers, startDate, endDate);
    setDailyActiveUsers(dailyData);
  
    // Create user creation data by month - only for users with Full Name
    const creationData = generateUserCreationData(users.filter(user => {
      const fullName = user.FullName || "";
      return fullName.trim() !== "";
    }));
    setUserCreationData(creationData);
  
    // Create monthly activity data - only for users with Full Name
    const monthlyData = generateMonthlyActivityData(users.filter(user => {
      const fullName = user.FullName || "";
      return fullName.trim() !== "";
    }));
    setMonthlyActivityData(monthlyData);
  };
  

  const generateDailyActivityData = (users, startDate, endDate) => {
    // Create a map for each day in the range
    const dailyMap = new Map();
  
    // Initialize the map with all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dailyMap.set(dateStr, { date: dateStr, activeUsers: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    // Count active users for each day
    // Note: We expect 'users' to already be filtered for those with a valid Full Name
    users.forEach((user) => {
      const monthYearKeys = Object.keys(user).filter((key) =>
        /[A-Za-z]{3}\s\d{4}/.test(key)
      );
  
      monthYearKeys.forEach((month) => {
        if (user[month] && user[month].M) {
          Object.entries(user[month].M).forEach(([dayKey, value]) => {
            const [day, monthStr, yearStr] = dayKey.split("/");
            // Use the consistent date parsing function
            const dateObj = parseActivityDate(day, monthStr, yearStr);
  
            if (
              dateObj >= startDate &&
              dateObj <= endDate &&
              parseInt(value.N) > 0
            ) {
              const dateStr = dateObj.toISOString().split("T")[0];
              const dayData = dailyMap.get(dateStr);
              if (dayData) {
                dailyMap.set(dateStr, {
                  ...dayData,
                  activeUsers: dayData.activeUsers + 1,
                });
              }
            }
          });
        }
      });
    });
  
    return Array.from(dailyMap.values());
  };

  const generateUserCreationData = (users) => {
    // Convert startDate and endDate to actual Date objects
    const startDate = new Date(
      Date.UTC(
        parseInt(dateRange.startDate.split("-")[0]),
        parseInt(dateRange.startDate.split("-")[1]) - 1,
        1 // First day of the start month
      )
    );

    const endDate = new Date(
      Date.UTC(
        parseInt(dateRange.endDate.split("-")[0]),
        parseInt(dateRange.endDate.split("-")[1]) - 1,
        31, // Last day of the end month
        23,
        59,
        59 // Set to end of day
      )
    );

    // Initialize the monthly creation object
    const monthlyCreation = new Map();

    // Collect user creations within the date range
    users.forEach((user) => {
      if (user.created && user.created.S) {
        const created = user.created.S;
        const year = created.substring(0, 4);
        const month = created.substring(4, 6);

        // Convert numeric month to month name
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthName = monthNames[parseInt(month) - 1];
        const monthYear = `${monthName} ${year}`;

        // Convert user creation date to Date object
        const userCreationDate = new Date(
          Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            1 // First day of the month
          )
        );

        // Check if user creation is within the selected date range
        if (userCreationDate >= startDate && userCreationDate <= endDate) {
          monthlyCreation.set(
            monthYear,
            (monthlyCreation.get(monthYear) || 0) + 1
          );
        }
      }
    });

    // Convert to sorted array
    return Array.from(monthlyCreation.entries())
      .map(([month, count]) => ({
        month,
        newUsers: count,
      }))
      .sort((a, b) => {
        const monthOrder = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const [monthA, yearA] = a.month.split(" ");
        const [monthB, yearB] = b.month.split(" ");

        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
      });
  };

  const generateMonthlyActivityData = (users) => {
    // Convert startDate and endDate to actual Date objects
    const startDate = new Date(
      Date.UTC(
        parseInt(dateRange.startDate.split("-")[0]),
        parseInt(dateRange.startDate.split("-")[1]) - 1,
        1 // First day of the start month
      )
    );

    const endDate = new Date(
      Date.UTC(
        parseInt(dateRange.endDate.split("-")[0]),
        parseInt(dateRange.endDate.split("-")[1]) - 1,
        31, // Last day of the end month
        23,
        59,
        59 // Set to end of day
      )
    );

    // Initialize monthly activity count object
    const monthlyActivity = new Map();

    // Dynamically find all unique month/year keys across all users
    const allMonthYearKeys = new Set();

    users.forEach((user) => {
      Object.keys(user).forEach((key) => {
        if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
          allMonthYearKeys.add(key);
        }
      });
    });

    // Sort and filter month/year keys chronologically within the date range
    const sortedMonthYears = Array.from(allMonthYearKeys)
      .sort((a, b) => {
        const [monthA, yearA] = a.split(" ");
        const [monthB, yearB] = b.split(" ");

        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return months.indexOf(monthA) - months.indexOf(monthB);
      })
      .filter((monthYear) => {
        const [month, year] = monthYear.split(" ");
        const monthDate = new Date(
          Date.UTC(
            parseInt(year),
            [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].indexOf(month),
            1 // First day of the month
          )
        );

        return monthDate >= startDate && monthDate <= endDate;
      });

    // Initialize the filtered month/years
    sortedMonthYears.forEach((monthYear) => {
      monthlyActivity.set(monthYear, 0);
    });

    // For each user, count if they had activity in each month within the range
    users.forEach((user) => {
      Array.from(monthlyActivity.keys()).forEach((monthYear) => {
        if (user[monthYear] && user[monthYear].M) {
          // This user had activity in this month
          monthlyActivity.set(monthYear, monthlyActivity.get(monthYear) + 1);
        }
      });
    });

    return Array.from(monthlyActivity.entries()).map(([month, count]) => ({
      month,
      activeUsers: count,
    }));
  };

  // Function to export daily active users data as CSV
  // const exportDailyActiveUsers = () => {
  //   if (!dailyActiveUsers || dailyActiveUsers.length === 0) {
  //     alert('No daily active users data available. Please generate reports first.');
  //     return;
  //   }

  //   // Create CSV content
  //   let csvContent = 'date,activeUsers\n';

  //   dailyActiveUsers.forEach(day => {
  //     csvContent += `${day.date},${day.activeUsers}\n`;
  //   });

  //   // Create a Blob with the CSV content
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  //   // Create a download link and trigger the download
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', `daily_active_users_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
  //   link.style.visibility = 'hidden';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  // Function to export daily active users data
const exportDailyActiveUsers = () => {
  if (!dailyActiveUsers || dailyActiveUsers.length === 0) {
    alert(
      "No daily active users data available. Please generate reports first."
    );
    return;
  }

  // Convert date strings to UTC dates to avoid timezone issues
  const startDate = new Date(
    Date.UTC(
      parseInt(dateRange.startDate.split("-")[0]),
      parseInt(dateRange.startDate.split("-")[1]) - 1,
      parseInt(dateRange.startDate.split("-")[2])
    )
  );

  const endDate = new Date(
    Date.UTC(
      parseInt(dateRange.endDate.split("-")[0]),
      parseInt(dateRange.endDate.split("-")[1]) - 1,
      parseInt(dateRange.endDate.split("-")[2]),
      23,
      59,
      59 // Set to end of day
    )
  );

  // Filter active users within the date range
  const allActiveUsers = userData.filter((user) => {
    let hasActivityInRange = false;

    const monthYearKeys = Object.keys(user).filter((key) =>
      /[A-Za-z]{3}\s\d{4}/.test(key)
    );

    monthYearKeys.forEach((monthYear) => {
      if (user[monthYear] && user[monthYear].M) {
        Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
          const [day, monthStr, yearStr] = dayKey.split("/");
          const dateObj = parseActivityDate(day, monthStr, yearStr);

          if (
            dateObj >= startDate &&
            dateObj <= endDate &&
            parseInt(value.N) > 0
          ) {
            hasActivityInRange = true;
          }
        });
      }
    });

    return hasActivityInRange;
  });
  
  // Further filter to only include users with a valid FullName
  const activeUsers = allActiveUsers.filter(user => {
    const fullName = user.FullName || "";
    return fullName.trim() !== "";
  });

  // Helper function to safely convert values to strings and escape them for CSV
  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    
    // Handle the case where the value is an object with S property
    if (typeof value === "object" && value !== null) {
      if (value.S !== undefined) {
        value = value.S;
      } else {
        value = JSON.stringify(value);
      }
    }
    
    // Convert to string and escape quotes for CSV
    return String(value).replace(/"/g, '""');
  };

  // Create a new workbook and add worksheets
  const wb = XLSX.utils.book_new();

  // Prepare Daily Active Users data
  const dailyActiveUsersSheet = dailyActiveUsers.map((day) => ({
    Date: day.date,
    "Active Users": day.activeUsers,
  }));

  // Prepare Active Users Details with requested column sequence
  const activeUsersDetailsSheet = activeUsers.map((user) => ({
    "ID": safeString(user.user_id?.S || ""),
    "Full Name": safeString(user.FullName || ""),
    "Gender": safeString(user.Gender || ""),
    "Age": safeString(user.Age || ""),
    "Sign up": safeString(user.device || ""),
    "Last login": safeString(user.lastLogin || "")
  }));

  // Add Daily Active Users sheet
  const dailyWs = XLSX.utils.json_to_sheet(dailyActiveUsersSheet);
  XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Active Users");

  // Add Active Users Details sheet
  const usersWs = XLSX.utils.json_to_sheet(activeUsersDetailsSheet);
  XLSX.utils.book_append_sheet(wb, usersWs, "Active Users Details");

  // Export the workbook
  XLSX.writeFile(
    wb,
    `active_users_report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`
  );
};

  // Function to export all API data as CSV
  // const exportAllUsersData = () => {
  //   if (!rawApiData || !rawApiData.users || rawApiData.users.length === 0) {
  //     alert('No API data available. Please generate reports first.');
  //     return;
  //   }

  //   const users = rawApiData.users;

  //   // Get all possible month/year combinations across all users
  //   const allMonthYearKeys = new Set();
  //   users.forEach(user => {
  //     Object.keys(user).forEach(key => {
  //       if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
  //         allMonthYearKeys.add(key);
  //       }
  //     });
  //   });

  //   // Sort the month/year keys chronologically
  //   const sortedMonthYears = Array.from(allMonthYearKeys).sort((a, b) => {
  //     const [monthA, yearA] = a.split(' ');
  //     const [monthB, yearB] = b.split(' ');

  //     if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

  //     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  //     return months.indexOf(monthA) - months.indexOf(monthB);
  //   });

  //   // Collect all standard fields that aren't month/year keys
  //   const standardFields = ["user_id", "created", "lastActive"];

  //   // Create CSV header
  //   let csvContent = '"user_id","created",';

  //   // Add month/year columns to header
  //   sortedMonthYears.forEach(monthYear => {
  //     csvContent += `"${monthYear}",`;
  //   });

  //   // Add lastActive at the end and remove trailing comma
  //   csvContent = csvContent.slice(0, -1) + '\n';

  //   // Add data rows
  //   users.forEach(user => {
  //     // Add user_id
  //     csvContent += `"${user.user_id?.S || ''}",`;

  //     // Add created date
  //     csvContent += `"${user.created?.S || ''}",`;

  //     // Add data for each month/year
  //     sortedMonthYears.forEach(monthYear => {
  //       if (user[monthYear] && user[monthYear].M) {
  //         // Stringify the month's activity data
  //         const activityData = JSON.stringify(user[monthYear].M).replace(/"/g, '""');
  //         csvContent += `"${activityData}",`;
  //       } else {
  //         csvContent += '"",';
  //       }
  //     });

  //     // Add lastActive and remove trailing comma
  //     csvContent += `"${user.lastActive?.S || ''}"\n`;
  //   });

  //   // Create a Blob with the CSV content
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  //   // Create a download link and trigger the download
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', 'all_users_data.csv');
  //   link.style.visibility = 'hidden';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  // Function to export all API data as CSV
// Function to export all API data as CSV
const exportAllUsersData = () => {
  if (!rawApiData || !rawApiData.users || rawApiData.users.length === 0) {
    alert("No API data available. Please generate reports first.");
    return;
  }

  // Filter users to only include those with valid user_id and FullName
  const users = rawApiData.users.filter(user => {
    const userId = user.user_id?.S || "";
    const fullName = user.FullName || "";
    
    // Only include users that have both user_id and FullName
    return userId.trim() !== "" && fullName.trim() !== "";
  });
  
  if (users.length === 0) {
    alert("No valid user data available with both user_id and FullName.");
    return;
  }

  // Get all possible month/year combinations across all users
  const allMonthYearKeys = new Set();
  users.forEach((user) => {
    Object.keys(user).forEach((key) => {
      if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
        allMonthYearKeys.add(key);
      }
    });
  });

  // Sort the month/year keys chronologically
  const sortedMonthYears = Array.from(allMonthYearKeys).sort((a, b) => {
    const [monthA, yearA] = a.split(" ");
    const [monthB, yearB] = b.split(" ");

    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months.indexOf(monthA) - months.indexOf(monthB);
  });

  // Helper function to safely convert values to strings and escape them for CSV
  const safeString = (value) => {
    if (value === null || value === undefined) return '""';

    // Handle the case where the value is an object with S property
    if (typeof value === "object" && value !== null) {
      if (value.S !== undefined) {
        value = value.S;
      } else {
        value = JSON.stringify(value);
      }
    }

    // Convert to string and escape quotes
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  // Create CSV header with the requested sequence
  let csvContent = '"Id","Name","Gender","Age","Sign up with","Created timestamp","Last login",';

  // Add month/year columns to header
  sortedMonthYears.forEach((monthYear) => {
    csvContent += `"${monthYear}",`;
  });

  // Remove trailing comma and add newline
  csvContent = csvContent.slice(0, -1) + "\n";

  // Add data rows
  users.forEach((user) => {
    // Process fields in the requested sequence
    const userId = safeString(user.user_id?.S || "");
    const fullName = safeString(user.FullName || "");
    const gender = safeString(user.Gender || "");
    const age = safeString(user.Age || "");
    const signUpWith = safeString(user.device || "");
    const createdTimestamp = safeString(user.createdTimestamp || user.created?.S || "");
    const lastLogin = safeString(user.lastLogin || "");

    // Add the user data in the requested sequence
    csvContent += `${userId},${fullName},${gender},${age},${signUpWith},${createdTimestamp},${lastLogin},`;

    // Add data for each month/year
    sortedMonthYears.forEach((monthYear) => {
      if (user[monthYear] && user[monthYear].M) {
        // Stringify the month's activity data
        const activityData = JSON.stringify(user[monthYear].M).replace(
          /"/g,
          '""'
        );
        csvContent += `"${activityData}",`;
      } else {
        csvContent += '"",';
      }
    });

    // Remove trailing comma and add newline
    csvContent = csvContent.slice(0, -1) + `\n`;
  });

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a download link and trigger the download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "all_users_data.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  useEffect(() => {
    // Load data on component mount
    fetchAllReports();
  }, []);

 // Update data when date range changes
useEffect(() => {
  if (userData.length > 0) {
    // Convert date strings to UTC dates to avoid timezone issues
    const startDate = new Date(
      Date.UTC(
        parseInt(dateRange.startDate.split("-")[0]),
        parseInt(dateRange.startDate.split("-")[1]) - 1,
        parseInt(dateRange.startDate.split("-")[2])
      )
    );

    const endDate = new Date(
      Date.UTC(
        parseInt(dateRange.endDate.split("-")[0]),
        parseInt(dateRange.endDate.split("-")[1]) - 1,
        parseInt(dateRange.endDate.split("-")[2]),
        23,
        59,
        59 // Set to end of day
      )
    );

    // Filter for active users within the date range first
    const activeUsersInRange = userData.filter((user) => {
      let hasActivityInRange = false;

      const monthYearKeys = Object.keys(user).filter((key) =>
        /[A-Za-z]{3}\s\d{4}/.test(key)
      );

      monthYearKeys.forEach((monthYear) => {
        if (user[monthYear] && user[monthYear].M) {
          Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
            const [day, monthStr, yearStr] = dayKey.split("/");
            // Use the consistent date parsing function
            const dateObj = parseActivityDate(day, monthStr, yearStr);

            if (
              dateObj >= startDate &&
              dateObj <= endDate &&
              parseInt(value.N) > 0
            ) {
              hasActivityInRange = true;
            }
          });
        }
      });

      return hasActivityInRange;
    });

    // Further filter to only include users with a valid Full Name
    const activeUsers = activeUsersInRange.filter(user => {
      const fullName = user.FullName || "";
      return fullName.trim() !== "";
    });

    // Set the count of active users with valid Full Name
    setActiveUsersCount(activeUsers.length);

    // Generate daily active users data - only from users with a valid Full Name
    const dailyData = generateDailyActivityData(activeUsers, startDate, endDate);
    setDailyActiveUsers(dailyData);
  }
}, [dateRange, userData]);

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];

  return (
    <div className="PageReport">
      <div className="dashboard-container">
        <div className="header">
          <h1>User Activity Dashboard</h1>

          <div className="date-controls">
            <div className="date-field">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
            <div className="date-field">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
            <div className="button-container">
              <button
                onClick={fetchAllReports}
                style={{ color: "black", fontWeight: "bold" }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Generate Reports"}
              </button>
            </div>
            <div className="button-container">
              <button
                onClick={fetchDeviceData}
                style={{ color: "black", fontWeight: "bold" }}
                disabled={loading}
              >
                {loading ? "Loading..." : "User Details"}
              </button>
            </div>
            <div className="button-container">
              <button
                onClick={fetchSingerSongDetails}
                style={{ color: "black", fontWeight: "bold" }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Singer Song Details"}
              </button>
            </div>
          </div>

          {/* New Song Date Range Section */}
          <div className="date-controls" style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
            <h3 style={{ width: "100%", marginBottom: "10px", fontSize: "16px" }}>Singer Song Date Range</h3>
            <div className="date-field">
              <label htmlFor="songStartDate">Start Date</label>
              <input
                type="date"
                id="songStartDate"
                value={dateSong.startDate}
                onChange={(e) => handleSongDateChange(e, 'startDate')}
              />
            </div>
            <div className="date-field">
              <label htmlFor="songEndDate">End Date</label>
              <input
                type="date"
                id="songEndDate"
                value={dateSong.endDate}
                onChange={(e) => handleSongDateChange(e, 'endDate')}
              />
            </div>
            <div className="button-container">
              <button
                onClick={fetchSingerSongDetails}
                style={{ color: "black", fontWeight: "bold" }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Fetch Song Data"}
              </button>
            </div>
          </div>

          <div className="summary-box">
            <h2>Active Users Summary</h2>
            <div className="user-count">{activeUsersCount}</div>
            <div className="summary-desc">
              Active users in the selected date range
            </div>
            <div className="export-buttons">
              <button
                onClick={exportDailyActiveUsers}
                className="export-button"
                disabled={dailyActiveUsers.length === 0}
                title="Export daily active users data for selected date range"
              >
                Export Data (CSV)
              </button>
              <button
                onClick={exportAllUsersData}
                className="export-button"
                disabled={!rawApiData}
                title="Export all API data as CSV"
              >
                Export All Data (CSV)
              </button>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          {/* Daily Active Users Chart */}
          <div className="chart-container">
            <h2>Daily Active Users</h2>
            <div className="chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dailyActiveUsers}
                  margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={10}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="activeUsers"
                    fill="#8884d8"
                    name="Active Users"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="chart-container">
            <h2>User Growth</h2>
            <div className="chart">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={userCreationData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    fill="#82ca9d"
                    stroke="#82ca9d"
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Active Users Chart */}
          <div className="chart-container">
            <h2>Monthly Active Users</h2>
            <div className="chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={monthlyActivityData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Activity Summary */}
          <div className="chart-container">
            <h2>User Activity Summary</h2>
            <div className="chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={monthlyActivityData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="month" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="activeUsers"
                    fill="#8884d8"
                    name="Active Users"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;








// import React, { useState, useEffect } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   AreaChart,
//   Area,
// } from "recharts";
// import "./Reports.css"; // Make sure to import your existing CSS file
// import * as XLSX from "xlsx";

// const Reports = () => {
//   const [userData, setUserData] = useState([]);
//   const [rawApiData, setRawApiData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [dateRange, setDateRange] = useState({
//     startDate: "2024-11-01",
//     endDate: "2025-03-05",
//   });
//   const [activeUsersCount, setActiveUsersCount] = useState(0);
//   const [dailyActiveUsers, setDailyActiveUsers] = useState([]);
//   const [userCreationData, setUserCreationData] = useState([]);
//   const [monthlyActivityData, setMonthlyActivityData] = useState([]);
//   const [deviceData, setDeviceData] = useState(null);

//   const parseActivityDate = (day, month, year) => {
//     // Make sure all parts are treated as integers and create UTC date
//     return new Date(
//       Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
//     );
//   };

//   const getCurrentDate = () => {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, '0');
//     const day = String(today.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   const [dateSong, setDateSong] = useState({
//     startDate: getCurrentDate(),
//     endDate: getCurrentDate()
//   });

//   const [songData, setSongData] = useState([]);

//   // New function to fetch device data from API
//   const fetchDeviceData = async () => {
//     setLoading(true);

//     try {
//       const response = await fetch(
//         "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_user_device_details"
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch Device Reports");
//       }
//       const data = await response.json();
//       console.log("Device data:", data);

//       // Store the device data
//       setDeviceData(data);

//       // Export the data immediately
//       exportDeviceData(data);

//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching device data:", error);
//       setLoading(false);
//       alert("Error fetching device data: " + error.message);
//     }
//   };

//   const handleSongDateChange = (e, dateType) => {
//     const newValue = e.target.value;
//     const currentDate = getCurrentDate();
    
//     // Prevent any date from being greater than current date
//     if (newValue > currentDate) {
//       alert(`${dateType === 'startDate' ? 'Start' : 'End'} date cannot be greater than current date`);
//       return;
//     }
    
//     if (dateType === 'endDate') {
//       // Make sure end date is not before start date
//       if (newValue < dateSong.startDate) {
//         alert('End date cannot be before start date');
//         return;
//       }
      
//       setDateSong({ ...dateSong, endDate: newValue });
//     } else if (dateType === 'startDate') {
//       // Make sure start date is not after end date
//       if (newValue > dateSong.endDate) {
//         // Option 1: Adjust end date to match start date
//         setDateSong({ startDate: newValue, endDate: newValue });
//         // Option 2: Prevent the change (uncomment this instead if preferred)
//         // alert('Start date cannot be after end date');
//         // return;
//       } else {
//         setDateSong({ ...dateSong, startDate: newValue });
//       }
//     }
//   };

// // Updated fetchSingerSongDetails function to fetch all data and filter client-side
// const fetchSingerSongDetails = async () => {
//   setLoading(true);
//   try {
//     console.log(`Fetching song details for date range: ${dateSong.startDate} to ${dateSong.endDate}`);
    
//     // Fetch all song data without date parameters
//     const response = await fetch(
//       "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/getSingerSongDailyDetails"
//     );
//     if (!response.ok) {
//       throw new Error('Failed to fetch Singer Song Details');
//     }
//     const data = await response.json();
//     console.log('Singer Song Details (raw) count:', data.songs.length);
    
//     // Filter songs based on the selected date range
//     const filteredSongs = filterSongsByDateRange(data.songs, dateSong.startDate, dateSong.endDate);
//     console.log('Filtered Song Details count:', filteredSongs.length);
    
//     // Add date range play count directly to the filtered songs
//     const songsWithRangeCounts = filteredSongs.map(song => {
//       const dateRangePlayCount = calculatePlayCountInDateRange(song, dateSong.startDate, dateSong.endDate);
//       console.log(`Song ID: ${song.song_id}, Name: ${song.songName}, Date Range Count: ${dateRangePlayCount}`);
      
//       return {
//         ...song,
//         dateRangePlayCount
//       };
//     });
    
//     // Set the enhanced song data to state
//     setSongData(songsWithRangeCounts);
    
//     // Export the filtered data immediately (only if there are songs to export)
//     if (filteredSongs.length > 0) {
//       exportSongData(filteredSongs, dateSong.startDate, dateSong.endDate);
//     } else {
//       alert("No song data found for the selected date range.");
//     }
    
//     setLoading(false);
//   } catch (error) {
//     console.error('Error fetching singer song details:', error);
//     setLoading(false);
//     alert('Error fetching singer song details: ' + error.message);
//   }
// };

// // Improved function to filter songs by date range
// const filterSongsByDateRange = (songs, startDateStr, endDateStr) => {
//   if (!songs || !Array.isArray(songs) || songs.length === 0) {
//     return [];
//   }
  
//   // Convert input date strings to Date objects for comparison
//   const startDate = new Date(startDateStr);
//   const endDate = new Date(endDateStr);
//   endDate.setHours(23, 59, 59); // Set to end of day
  
//   console.log(`Filtering songs from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
//   return songs.filter(song => {
//     // Check if the song has play data within the date range
//     let hasPlayInRange = false;
    
//     // Iterate through all month/year keys (like "Apr 2025")
//     Object.keys(song).forEach(key => {
//       // Check if this is a month/year key
//       if (key.match(/[A-Za-z]{3}\s\d{4}/)) {
//         const monthData = song[key];
        
//         // Check each day in the month
//         if (monthData && typeof monthData === 'object') {
//           Object.keys(monthData).forEach(dayKey => {
//             // Skip if not in DD/MM/YYYY format
//             if (!dayKey.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
//               return;
//             }
            
//             // Parse the date from the day key (format: "DD/MM/YYYY")
//             const [day, month, year] = dayKey.split('/');
            
//             // Create date from parts
//             try {
//               const playDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
              
//               // Check if this play date falls within our date range
//               if (!isNaN(playDate.getTime()) && playDate >= startDate && playDate <= endDate) {
//                 hasPlayInRange = true;
//               }
//             } catch (error) {
//               console.warn(`Invalid date format: ${dayKey}`, error);
//             }
//           });
//         }
//       }
//     });
    
//     return hasPlayInRange;
//   });
// };

// // Function to calculate play count within a date range for a single song
// const calculatePlayCountInDateRange = (song, startDateStr, endDateStr) => {
//   if (!song) return 0;
  
//   // Convert input date strings to Date objects for comparison
//   const startDate = new Date(startDateStr);
//   const endDate = new Date(endDateStr);
//   endDate.setHours(23, 59, 59); // Set to end of day
  
//   let totalCount = 0;
  
//   // Iterate through all month/year keys (like "Apr 2025")
//   Object.keys(song).forEach(key => {
//     // Check if this is a month/year key
//     if (key.match(/[A-Za-z]{3}\s\d{4}/)) {
//       const monthData = song[key];
      
//       // Check each day in the month
//       if (monthData && typeof monthData === 'object') {
//         Object.keys(monthData).forEach(dayKey => {
//           // Skip if not in DD/MM/YYYY format
//           if (!dayKey.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
//             return;
//           }
          
//           // Parse the date from the day key (format: "DD/MM/YYYY")
//           const [day, month, year] = dayKey.split('/');
          
//           // Create date from parts
//           try {
//             const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//             const playDate = new Date(dateStr);
            
//             // Check if this play date falls within our date range
//             if (!isNaN(playDate.getTime()) && playDate >= startDate && playDate <= endDate) {
//               const countN = parseInt(monthData[dayKey].N || "0");
//               totalCount += countN;
//             }
//           } catch (error) {
//             console.warn(`Invalid date format: ${dayKey}`, error);
//           }
//         });
//       }
//     }
//   });
  
//   return totalCount;
// };

// // Function to export song data as CSV/Excel
// // const exportSongData = (songs) => {
// //   if (!songs || songs.length === 0) {
// //     alert("No song data available to export for the selected date range.");
// //     return;
// //   }

// //   // Create a new workbook
// //   const wb = XLSX.utils.book_new();

// //   // Prepare song data for export
// //   const songExportData = songs.map(song => ({
// //     "User ID": song.user_id || "",
// //     "Artist Name": song.full_name || "",
// //     "Song ID": song.song_id || "",
// //     "Song Name": song.songName || "",
// //     "Total Play Count": song.totalPlayCount || "0",
// //     // You can uncomment these if needed
// //     //"Last Played": song.lastPlayed || "",
// //     //"Created": song.created || ""
// //   }));

// //   // Create worksheet
// //   const ws = XLSX.utils.json_to_sheet(songExportData);
  
// //   // Add worksheet to workbook
// //   XLSX.utils.book_append_sheet(wb, ws, "Song Data");

// //   // Export the workbook
// //   XLSX.writeFile(
// //     wb,
// //     `song_play_data_${dateSong.startDate}_to_${dateSong.endDate}.xlsx`
// //   );
// // };

// // Function to export song data as CSV
// const exportSongData = (songs, startDateStr, endDateStr) => {
//   if (!songs || songs.length === 0) {
//     alert("No song data available to export for the selected date range.");
//     return;
//   }

//   console.log("Starting song data export with date range calculation");
//   console.log(`Date range: ${startDateStr} to ${endDateStr}`);

//   // Create a new workbook
//   const wb = XLSX.utils.book_new();

//   // Prepare song data for export with date range calculation
//   const songExportData = songs.map(song => {
//     // Calculate play count within the date range
//     const dateRangePlayCount = calculatePlayCountInDateRange(song, startDateStr, endDateStr);
    
//     console.log(`Song: ${song.songName}, Total: ${song.totalPlayCount}, Date Range: ${dateRangePlayCount}`);
    
//     return {
//       "User ID": song.user_id || "",
//       "Artist Name": song.full_name || "",
//       "Song ID": song.song_id || "",
//       "Song Name": song.songName || "",
//       "Total Play Count": song.totalPlayCount || "0",
//       "Streams Count": dateRangePlayCount.toString(),
//       "Date Range": `${startDateStr} to ${endDateStr}`
//     };
//   });

//   // Create worksheet
//   const ws = XLSX.utils.json_to_sheet(songExportData);
  
//   // Add worksheet to workbook
//   XLSX.utils.book_append_sheet(wb, ws, "Song Data");

//   // Export the workbook
//   XLSX.writeFile(
//     wb,
//     `song_play_data_${startDateStr}_to_${endDateStr}.xlsx`
//   );
  
//   console.log("Song data export complete");
// };

//   // Function to export device data as CSV
//   // const exportDeviceData = (data) => {
//   //   if (!data || !data.users || data.users.length === 0) {
//   //     alert('No device data available.');
//   //     return;
//   //   }

//   //   // Create CSV header
//   //   let csvContent = 'user_id,Signup_with,EmailId,lastLogin\n';

//   //   // Add data rows
//   //   data.users.forEach(user => {
//   //     // Escape fields that might contain commas
//   //     const emailId = user.EmailId ? `"${user.EmailId.replace(/"/g, '""')}"` : '""';
//   //     const device  = user.device ? `"${user.device.replace(/"/g, '""')}"` : '""';
//   //     const lastLogin = user.lastLogin ? `"${user.lastLogin.replace(/"/g, '""')}"` : '""';

//   //     csvContent += `${user.user_id || ''},${device},${emailId},${lastLogin}\n`;
//   //   });

//   //   // Create a Blob with the CSV content
//   //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

//   //   // Create a download link and trigger the download
//   //   const link = document.createElement('a');
//   //   const url = URL.createObjectURL(blob);
//   //   link.setAttribute('href', url);
//   //   link.setAttribute('download', `device_report_${new Date().toISOString().split('T')[0]}.csv`);
//   //   link.style.visibility = 'hidden';
//   //   document.body.appendChild(link);
//   //   link.click();
//   //   document.body.removeChild(link);
//   // };

//   // Function to export device data as CSV
// const exportDeviceData = (data) => {
//   if (!data || !data.users || data.users.length === 0) {
//     alert("No device data available.");
//     return;
//   }

//   // Filter users to only include those with a valid FullName
//   const filteredUsers = data.users.filter(user => {
//     const fullName = user.FullName || "";
//     return fullName.trim() !== "";
//   });

//   if (filteredUsers.length === 0) {
//     alert("No user data available with valid Full Name.");
//     return;
//   }

//   // Create CSV header with the requested sequence
//   let csvContent =
//     "user_id,FullName,StageName,Category,Gender,Age,EmailId,PhoneNumber,registrationDate,createdTimestamp,updatedTimestamp,Signup_with,lastLogin\n";

//   // Helper function to safely convert values to strings and escape them for CSV
//   const safeString = (value) => {
//     if (value === null || value === undefined) return '""';

//     // Handle the case where StageName is an object with S property
//     if (typeof value === "object" && value !== null) {
//       if (value.S !== undefined) {
//         value = value.S;
//       } else {
//         value = JSON.stringify(value);
//       }
//     }

//     // Convert to string and escape quotes
//     return `"${String(value).replace(/"/g, '""')}"`;
//   };

//   // Add data rows
//   filteredUsers.forEach((user) => {
//     // Process each field with the safeString helper in the requested sequence
//     const userId = user.user_id || "";
//     const fullName = safeString(user.FullName);
//     const stageName = safeString(user.StageName);
//     const category = safeString(user.Category);
//     const gender = safeString(user.Gender);
//     const age = user.Age || "";
//     const emailId = safeString(user.EmailId);
//     const phoneNumber = safeString(user.PhoneNumber);
//     const regDate = safeString(user.registrationDate);
//     const createdTime = safeString(user.createdTimestamp);
//     const updatedTime = safeString(user.updatedTimestamp);
//     const device = safeString(user.device);
//     const lastLogin = safeString(user.lastLogin);

//     csvContent += `${userId},${fullName},${stageName},${category},${gender},${age},${emailId},${phoneNumber},${regDate},${createdTime},${updatedTime},${device},${lastLogin}\n`;
//   });

//   // Create a Blob with the CSV content
//   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

//   // Create a download link and trigger the download
//   const link = document.createElement("a");
//   const url = URL.createObjectURL(blob);
//   link.setAttribute("href", url);
//   link.setAttribute(
//     "download",
//     `user_details_report_${new Date().toISOString().split("T")[0]}.csv`
//   );
//   link.style.visibility = "hidden";
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

//   // Fetch data from API
//   const fetchAllReports = async () => {
//     setLoading(true);

//     try {
//       const response = await fetch(
//         "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_all_userData"
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch All Reports");
//       }
//       const data = await response.json();
//       console.log(data);

//       // Store the raw API response for export functionality
//       setRawApiData(data);

//       // Process the fetched data
//       processUserData(data);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setLoading(false);
//     }
//   };

//   const processUserData = (data) => {
//     if (!data || !data.users) return;
  
//     const users = data.users;
//     setUserData(users);
  
//     // Convert date strings to UTC dates to avoid timezone issues
//     const startDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.startDate.split("-")[0]),
//         parseInt(dateRange.startDate.split("-")[1]) - 1,
//         parseInt(dateRange.startDate.split("-")[2])
//       )
//     );
  
//     const endDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.endDate.split("-")[0]),
//         parseInt(dateRange.endDate.split("-")[1]) - 1,
//         parseInt(dateRange.endDate.split("-")[2]),
//         23,
//         59,
//         59 // Set to end of day
//       )
//     );
  
//     // Filter for active users within the date range
//     const activeUsersInRange = users.filter((user) => {
//       let hasActivityInRange = false;
  
//       const monthYearKeys = Object.keys(user).filter((key) =>
//         /[A-Za-z]{3}\s\d{4}/.test(key)
//       );
  
//       monthYearKeys.forEach((monthYear) => {
//         if (user[monthYear] && user[monthYear].M) {
//           Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
//             const [day, monthStr, yearStr] = dayKey.split("/");
//             // Use the consistent date parsing function
//             const dateObj = parseActivityDate(day, monthStr, yearStr);
  
//             if (
//               dateObj >= startDate &&
//               dateObj <= endDate &&
//               parseInt(value.N) > 0
//             ) {
//               hasActivityInRange = true;
//             }
//           });
//         }
//       });
  
//       return hasActivityInRange;
//     });
  
//     // Further filter to only include users with a valid Full Name
//     const activeUsers = activeUsersInRange.filter(user => {
//       const fullName = user.FullName || "";
//       return fullName.trim() !== "";
//     });
  
//     // Set the count of active users with valid Full Name
//     setActiveUsersCount(activeUsers.length);
  
//     // Also update date handling in other function calls
//     // For daily active users graph, we should also only count users with a Full Name
//     const dailyData = generateDailyActivityData(activeUsers, startDate, endDate);
//     setDailyActiveUsers(dailyData);
  
//     // Create user creation data by month - only for users with Full Name
//     const creationData = generateUserCreationData(users.filter(user => {
//       const fullName = user.FullName || "";
//       return fullName.trim() !== "";
//     }));
//     setUserCreationData(creationData);
  
//     // Create monthly activity data - only for users with Full Name
//     const monthlyData = generateMonthlyActivityData(users.filter(user => {
//       const fullName = user.FullName || "";
//       return fullName.trim() !== "";
//     }));
//     setMonthlyActivityData(monthlyData);
//   };
  

//   const generateDailyActivityData = (users, startDate, endDate) => {
//     // Create a map for each day in the range
//     const dailyMap = new Map();
  
//     // Initialize the map with all dates in range
//     const currentDate = new Date(startDate);
//     while (currentDate <= endDate) {
//       const dateStr = currentDate.toISOString().split("T")[0];
//       dailyMap.set(dateStr, { date: dateStr, activeUsers: 0 });
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
  
//     // Count active users for each day
//     // Note: We expect 'users' to already be filtered for those with a valid Full Name
//     users.forEach((user) => {
//       const monthYearKeys = Object.keys(user).filter((key) =>
//         /[A-Za-z]{3}\s\d{4}/.test(key)
//       );
  
//       monthYearKeys.forEach((month) => {
//         if (user[month] && user[month].M) {
//           Object.entries(user[month].M).forEach(([dayKey, value]) => {
//             const [day, monthStr, yearStr] = dayKey.split("/");
//             // Use the consistent date parsing function
//             const dateObj = parseActivityDate(day, monthStr, yearStr);
  
//             if (
//               dateObj >= startDate &&
//               dateObj <= endDate &&
//               parseInt(value.N) > 0
//             ) {
//               const dateStr = dateObj.toISOString().split("T")[0];
//               const dayData = dailyMap.get(dateStr);
//               if (dayData) {
//                 dailyMap.set(dateStr, {
//                   ...dayData,
//                   activeUsers: dayData.activeUsers + 1,
//                 });
//               }
//             }
//           });
//         }
//       });
//     });
  
//     return Array.from(dailyMap.values());
//   };

//   const generateUserCreationData = (users) => {
//     // Convert startDate and endDate to actual Date objects
//     const startDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.startDate.split("-")[0]),
//         parseInt(dateRange.startDate.split("-")[1]) - 1,
//         1 // First day of the start month
//       )
//     );

//     const endDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.endDate.split("-")[0]),
//         parseInt(dateRange.endDate.split("-")[1]) - 1,
//         31, // Last day of the end month
//         23,
//         59,
//         59 // Set to end of day
//       )
//     );

//     // Initialize the monthly creation object
//     const monthlyCreation = new Map();

//     // Collect user creations within the date range
//     users.forEach((user) => {
//       if (user.created && user.created.S) {
//         const created = user.created.S;
//         const year = created.substring(0, 4);
//         const month = created.substring(4, 6);

//         // Convert numeric month to month name
//         const monthNames = [
//           "Jan",
//           "Feb",
//           "Mar",
//           "Apr",
//           "May",
//           "Jun",
//           "Jul",
//           "Aug",
//           "Sep",
//           "Oct",
//           "Nov",
//           "Dec",
//         ];
//         const monthName = monthNames[parseInt(month) - 1];
//         const monthYear = `${monthName} ${year}`;

//         // Convert user creation date to Date object
//         const userCreationDate = new Date(
//           Date.UTC(
//             parseInt(year),
//             parseInt(month) - 1,
//             1 // First day of the month
//           )
//         );

//         // Check if user creation is within the selected date range
//         if (userCreationDate >= startDate && userCreationDate <= endDate) {
//           monthlyCreation.set(
//             monthYear,
//             (monthlyCreation.get(monthYear) || 0) + 1
//           );
//         }
//       }
//     });

//     // Convert to sorted array
//     return Array.from(monthlyCreation.entries())
//       .map(([month, count]) => ({
//         month,
//         newUsers: count,
//       }))
//       .sort((a, b) => {
//         const monthOrder = [
//           "Jan",
//           "Feb",
//           "Mar",
//           "Apr",
//           "May",
//           "Jun",
//           "Jul",
//           "Aug",
//           "Sep",
//           "Oct",
//           "Nov",
//           "Dec",
//         ];
//         const [monthA, yearA] = a.month.split(" ");
//         const [monthB, yearB] = b.month.split(" ");

//         if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
//         return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
//       });
//   };

//   const generateMonthlyActivityData = (users) => {
//     // Convert startDate and endDate to actual Date objects
//     const startDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.startDate.split("-")[0]),
//         parseInt(dateRange.startDate.split("-")[1]) - 1,
//         1 // First day of the start month
//       )
//     );

//     const endDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.endDate.split("-")[0]),
//         parseInt(dateRange.endDate.split("-")[1]) - 1,
//         31, // Last day of the end month
//         23,
//         59,
//         59 // Set to end of day
//       )
//     );

//     // Initialize monthly activity count object
//     const monthlyActivity = new Map();

//     // Dynamically find all unique month/year keys across all users
//     const allMonthYearKeys = new Set();

//     users.forEach((user) => {
//       Object.keys(user).forEach((key) => {
//         if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
//           allMonthYearKeys.add(key);
//         }
//       });
//     });

//     // Sort and filter month/year keys chronologically within the date range
//     const sortedMonthYears = Array.from(allMonthYearKeys)
//       .sort((a, b) => {
//         const [monthA, yearA] = a.split(" ");
//         const [monthB, yearB] = b.split(" ");

//         const months = [
//           "Jan",
//           "Feb",
//           "Mar",
//           "Apr",
//           "May",
//           "Jun",
//           "Jul",
//           "Aug",
//           "Sep",
//           "Oct",
//           "Nov",
//           "Dec",
//         ];

//         if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
//         return months.indexOf(monthA) - months.indexOf(monthB);
//       })
//       .filter((monthYear) => {
//         const [month, year] = monthYear.split(" ");
//         const monthDate = new Date(
//           Date.UTC(
//             parseInt(year),
//             [
//               "Jan",
//               "Feb",
//               "Mar",
//               "Apr",
//               "May",
//               "Jun",
//               "Jul",
//               "Aug",
//               "Sep",
//               "Oct",
//               "Nov",
//               "Dec",
//             ].indexOf(month),
//             1 // First day of the month
//           )
//         );

//         return monthDate >= startDate && monthDate <= endDate;
//       });

//     // Initialize the filtered month/years
//     sortedMonthYears.forEach((monthYear) => {
//       monthlyActivity.set(monthYear, 0);
//     });

//     // For each user, count if they had activity in each month within the range
//     users.forEach((user) => {
//       Array.from(monthlyActivity.keys()).forEach((monthYear) => {
//         if (user[monthYear] && user[monthYear].M) {
//           // This user had activity in this month
//           monthlyActivity.set(monthYear, monthlyActivity.get(monthYear) + 1);
//         }
//       });
//     });

//     return Array.from(monthlyActivity.entries()).map(([month, count]) => ({
//       month,
//       activeUsers: count,
//     }));
//   };

//   // Function to export daily active users data as CSV
//   // const exportDailyActiveUsers = () => {
//   //   if (!dailyActiveUsers || dailyActiveUsers.length === 0) {
//   //     alert('No daily active users data available. Please generate reports first.');
//   //     return;
//   //   }

//   //   // Create CSV content
//   //   let csvContent = 'date,activeUsers\n';

//   //   dailyActiveUsers.forEach(day => {
//   //     csvContent += `${day.date},${day.activeUsers}\n`;
//   //   });

//   //   // Create a Blob with the CSV content
//   //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

//   //   // Create a download link and trigger the download
//   //   const link = document.createElement('a');
//   //   const url = URL.createObjectURL(blob);
//   //   link.setAttribute('href', url);
//   //   link.setAttribute('download', `daily_active_users_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
//   //   link.style.visibility = 'hidden';
//   //   document.body.appendChild(link);
//   //   link.click();
//   //   document.body.removeChild(link);
//   // };

//   // Function to export daily active users data
// const exportDailyActiveUsers = () => {
//   if (!dailyActiveUsers || dailyActiveUsers.length === 0) {
//     alert(
//       "No daily active users data available. Please generate reports first."
//     );
//     return;
//   }

//   // Convert date strings to UTC dates to avoid timezone issues
//   const startDate = new Date(
//     Date.UTC(
//       parseInt(dateRange.startDate.split("-")[0]),
//       parseInt(dateRange.startDate.split("-")[1]) - 1,
//       parseInt(dateRange.startDate.split("-")[2])
//     )
//   );

//   const endDate = new Date(
//     Date.UTC(
//       parseInt(dateRange.endDate.split("-")[0]),
//       parseInt(dateRange.endDate.split("-")[1]) - 1,
//       parseInt(dateRange.endDate.split("-")[2]),
//       23,
//       59,
//       59 // Set to end of day
//     )
//   );

//   // Filter active users within the date range
//   const allActiveUsers = userData.filter((user) => {
//     let hasActivityInRange = false;

//     const monthYearKeys = Object.keys(user).filter((key) =>
//       /[A-Za-z]{3}\s\d{4}/.test(key)
//     );

//     monthYearKeys.forEach((monthYear) => {
//       if (user[monthYear] && user[monthYear].M) {
//         Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
//           const [day, monthStr, yearStr] = dayKey.split("/");
//           const dateObj = parseActivityDate(day, monthStr, yearStr);

//           if (
//             dateObj >= startDate &&
//             dateObj <= endDate &&
//             parseInt(value.N) > 0
//           ) {
//             hasActivityInRange = true;
//           }
//         });
//       }
//     });

//     return hasActivityInRange;
//   });
  
//   // Further filter to only include users with a valid FullName
//   const activeUsers = allActiveUsers.filter(user => {
//     const fullName = user.FullName || "";
//     return fullName.trim() !== "";
//   });

//   // Helper function to safely convert values to strings and escape them for CSV
//   const safeString = (value) => {
//     if (value === null || value === undefined) return '';
    
//     // Handle the case where the value is an object with S property
//     if (typeof value === "object" && value !== null) {
//       if (value.S !== undefined) {
//         value = value.S;
//       } else {
//         value = JSON.stringify(value);
//       }
//     }
    
//     // Convert to string and escape quotes for CSV
//     return String(value).replace(/"/g, '""');
//   };

//   // Create a new workbook and add worksheets
//   const wb = XLSX.utils.book_new();

//   // Prepare Daily Active Users data
//   const dailyActiveUsersSheet = dailyActiveUsers.map((day) => ({
//     Date: day.date,
//     "Active Users": day.activeUsers,
//   }));

//   // Prepare Active Users Details with requested column sequence
//   const activeUsersDetailsSheet = activeUsers.map((user) => ({
//     "ID": safeString(user.user_id?.S || ""),
//     "Full Name": safeString(user.FullName || ""),
//     "Gender": safeString(user.Gender || ""),
//     "Age": safeString(user.Age || ""),
//     "Sign up": safeString(user.device || ""),
//     "Last login": safeString(user.lastLogin || "")
//   }));

//   // Add Daily Active Users sheet
//   const dailyWs = XLSX.utils.json_to_sheet(dailyActiveUsersSheet);
//   XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Active Users");

//   // Add Active Users Details sheet
//   const usersWs = XLSX.utils.json_to_sheet(activeUsersDetailsSheet);
//   XLSX.utils.book_append_sheet(wb, usersWs, "Active Users Details");

//   // Export the workbook
//   XLSX.writeFile(
//     wb,
//     `active_users_report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`
//   );
// };

//   // Function to export all API data as CSV
//   // const exportAllUsersData = () => {
//   //   if (!rawApiData || !rawApiData.users || rawApiData.users.length === 0) {
//   //     alert('No API data available. Please generate reports first.');
//   //     return;
//   //   }

//   //   const users = rawApiData.users;

//   //   // Get all possible month/year combinations across all users
//   //   const allMonthYearKeys = new Set();
//   //   users.forEach(user => {
//   //     Object.keys(user).forEach(key => {
//   //       if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
//   //         allMonthYearKeys.add(key);
//   //       }
//   //     });
//   //   });

//   //   // Sort the month/year keys chronologically
//   //   const sortedMonthYears = Array.from(allMonthYearKeys).sort((a, b) => {
//   //     const [monthA, yearA] = a.split(' ');
//   //     const [monthB, yearB] = b.split(' ');

//   //     if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

//   //     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//   //     return months.indexOf(monthA) - months.indexOf(monthB);
//   //   });

//   //   // Collect all standard fields that aren't month/year keys
//   //   const standardFields = ["user_id", "created", "lastActive"];

//   //   // Create CSV header
//   //   let csvContent = '"user_id","created",';

//   //   // Add month/year columns to header
//   //   sortedMonthYears.forEach(monthYear => {
//   //     csvContent += `"${monthYear}",`;
//   //   });

//   //   // Add lastActive at the end and remove trailing comma
//   //   csvContent = csvContent.slice(0, -1) + '\n';

//   //   // Add data rows
//   //   users.forEach(user => {
//   //     // Add user_id
//   //     csvContent += `"${user.user_id?.S || ''}",`;

//   //     // Add created date
//   //     csvContent += `"${user.created?.S || ''}",`;

//   //     // Add data for each month/year
//   //     sortedMonthYears.forEach(monthYear => {
//   //       if (user[monthYear] && user[monthYear].M) {
//   //         // Stringify the month's activity data
//   //         const activityData = JSON.stringify(user[monthYear].M).replace(/"/g, '""');
//   //         csvContent += `"${activityData}",`;
//   //       } else {
//   //         csvContent += '"",';
//   //       }
//   //     });

//   //     // Add lastActive and remove trailing comma
//   //     csvContent += `"${user.lastActive?.S || ''}"\n`;
//   //   });

//   //   // Create a Blob with the CSV content
//   //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

//   //   // Create a download link and trigger the download
//   //   const link = document.createElement('a');
//   //   const url = URL.createObjectURL(blob);
//   //   link.setAttribute('href', url);
//   //   link.setAttribute('download', 'all_users_data.csv');
//   //   link.style.visibility = 'hidden';
//   //   document.body.appendChild(link);
//   //   link.click();
//   //   document.body.removeChild(link);
//   // };

//   // Function to export all API data as CSV
// // Function to export all API data as CSV
// const exportAllUsersData = () => {
//   if (!rawApiData || !rawApiData.users || rawApiData.users.length === 0) {
//     alert("No API data available. Please generate reports first.");
//     return;
//   }

//   // Filter users to only include those with valid user_id and FullName
//   const users = rawApiData.users.filter(user => {
//     const userId = user.user_id?.S || "";
//     const fullName = user.FullName || "";
    
//     // Only include users that have both user_id and FullName
//     return userId.trim() !== "" && fullName.trim() !== "";
//   });
  
//   if (users.length === 0) {
//     alert("No valid user data available with both user_id and FullName.");
//     return;
//   }

//   // Get all possible month/year combinations across all users
//   const allMonthYearKeys = new Set();
//   users.forEach((user) => {
//     Object.keys(user).forEach((key) => {
//       if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
//         allMonthYearKeys.add(key);
//       }
//     });
//   });

//   // Sort the month/year keys chronologically
//   const sortedMonthYears = Array.from(allMonthYearKeys).sort((a, b) => {
//     const [monthA, yearA] = a.split(" ");
//     const [monthB, yearB] = b.split(" ");

//     if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

//     const months = [
//       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//     ];
//     return months.indexOf(monthA) - months.indexOf(monthB);
//   });

//   // Helper function to safely convert values to strings and escape them for CSV
//   const safeString = (value) => {
//     if (value === null || value === undefined) return '""';

//     // Handle the case where the value is an object with S property
//     if (typeof value === "object" && value !== null) {
//       if (value.S !== undefined) {
//         value = value.S;
//       } else {
//         value = JSON.stringify(value);
//       }
//     }

//     // Convert to string and escape quotes
//     return `"${String(value).replace(/"/g, '""')}"`;
//   };

//   // Create CSV header with the requested sequence
//   let csvContent = '"Id","Name","Gender","Age","Sign up with","Created timestamp","Last login",';

//   // Add month/year columns to header
//   sortedMonthYears.forEach((monthYear) => {
//     csvContent += `"${monthYear}",`;
//   });

//   // Remove trailing comma and add newline
//   csvContent = csvContent.slice(0, -1) + "\n";

//   // Add data rows
//   users.forEach((user) => {
//     // Process fields in the requested sequence
//     const userId = safeString(user.user_id?.S || "");
//     const fullName = safeString(user.FullName || "");
//     const gender = safeString(user.Gender || "");
//     const age = safeString(user.Age || "");
//     const signUpWith = safeString(user.device || "");
//     const createdTimestamp = safeString(user.createdTimestamp || user.created?.S || "");
//     const lastLogin = safeString(user.lastLogin || "");

//     // Add the user data in the requested sequence
//     csvContent += `${userId},${fullName},${gender},${age},${signUpWith},${createdTimestamp},${lastLogin},`;

//     // Add data for each month/year
//     sortedMonthYears.forEach((monthYear) => {
//       if (user[monthYear] && user[monthYear].M) {
//         // Stringify the month's activity data
//         const activityData = JSON.stringify(user[monthYear].M).replace(
//           /"/g,
//           '""'
//         );
//         csvContent += `"${activityData}",`;
//       } else {
//         csvContent += '"",';
//       }
//     });

//     // Remove trailing comma and add newline
//     csvContent = csvContent.slice(0, -1) + `\n`;
//   });

//   // Create a Blob with the CSV content
//   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

//   // Create a download link and trigger the download
//   const link = document.createElement("a");
//   const url = URL.createObjectURL(blob);
//   link.setAttribute("href", url);
//   link.setAttribute("download", "all_users_data.csv");
//   link.style.visibility = "hidden";
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

//   useEffect(() => {
//     // Load data on component mount
//     fetchAllReports();
//   }, []);

//  // Update data when date range changes
// useEffect(() => {
//   if (userData.length > 0) {
//     // Convert date strings to UTC dates to avoid timezone issues
//     const startDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.startDate.split("-")[0]),
//         parseInt(dateRange.startDate.split("-")[1]) - 1,
//         parseInt(dateRange.startDate.split("-")[2])
//       )
//     );

//     const endDate = new Date(
//       Date.UTC(
//         parseInt(dateRange.endDate.split("-")[0]),
//         parseInt(dateRange.endDate.split("-")[1]) - 1,
//         parseInt(dateRange.endDate.split("-")[2]),
//         23,
//         59,
//         59 // Set to end of day
//       )
//     );

//     // Filter for active users within the date range first
//     const activeUsersInRange = userData.filter((user) => {
//       let hasActivityInRange = false;

//       const monthYearKeys = Object.keys(user).filter((key) =>
//         /[A-Za-z]{3}\s\d{4}/.test(key)
//       );

//       monthYearKeys.forEach((monthYear) => {
//         if (user[monthYear] && user[monthYear].M) {
//           Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
//             const [day, monthStr, yearStr] = dayKey.split("/");
//             // Use the consistent date parsing function
//             const dateObj = parseActivityDate(day, monthStr, yearStr);

//             if (
//               dateObj >= startDate &&
//               dateObj <= endDate &&
//               parseInt(value.N) > 0
//             ) {
//               hasActivityInRange = true;
//             }
//           });
//         }
//       });

//       return hasActivityInRange;
//     });

//     // Further filter to only include users with a valid Full Name
//     const activeUsers = activeUsersInRange.filter(user => {
//       const fullName = user.FullName || "";
//       return fullName.trim() !== "";
//     });

//     // Set the count of active users with valid Full Name
//     setActiveUsersCount(activeUsers.length);

//     // Generate daily active users data - only from users with a valid Full Name
//     const dailyData = generateDailyActivityData(activeUsers, startDate, endDate);
//     setDailyActiveUsers(dailyData);
//   }
// }, [dateRange, userData]);

//   const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];

//   return (
//     <div className="PageReport">
//       <div className="dashboard-container">
//         <div className="header">
//           <h1>User Activity Dashboard</h1>

//           <div className="date-controls">
//             <div className="date-field">
//               <label htmlFor="startDate">Start Date</label>
//               <input
//                 type="date"
//                 id="startDate"
//                 value={dateRange.startDate}
//                 onChange={(e) =>
//                   setDateRange({ ...dateRange, startDate: e.target.value })
//                 }
//               />
//             </div>
//             <div className="date-field">
//               <label htmlFor="endDate">End Date</label>
//               <input
//                 type="date"
//                 id="endDate"
//                 value={dateRange.endDate}
//                 onChange={(e) =>
//                   setDateRange({ ...dateRange, endDate: e.target.value })
//                 }
//               />
//             </div>
//             <div className="button-container">
//               <button
//                 onClick={fetchAllReports}
//                 style={{ color: "black", fontWeight: "bold" }}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "Generate Reports"}
//               </button>
//             </div>
//             <div className="button-container">
//               <button
//                 onClick={fetchDeviceData}
//                 style={{ color: "black", fontWeight: "bold" }}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "User Details"}
//               </button>
//             </div>
//             <div className="button-container">
//               <button
//                 onClick={fetchSingerSongDetails}
//                 style={{ color: "black", fontWeight: "bold" }}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "Singer Song Details"}
//               </button>
//             </div>
//           </div>

//           {/* New Song Date Range Section */}
//           <div className="date-controls" style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
//             <h3 style={{ width: "100%", marginBottom: "10px", fontSize: "16px" }}>Singer Song Date Range</h3>
//             <div className="date-field">
//               <label htmlFor="songStartDate">Start Date</label>
//               <input
//                 type="date"
//                 id="songStartDate"
//                 value={dateSong.startDate}
//                 onChange={(e) => handleSongDateChange(e, 'startDate')}
//               />
//             </div>
//             <div className="date-field">
//               <label htmlFor="songEndDate">End Date</label>
//               <input
//                 type="date"
//                 id="songEndDate"
//                 value={dateSong.endDate}
//                 onChange={(e) => handleSongDateChange(e, 'endDate')}
//               />
//             </div>
//             <div className="button-container">
//               <button
//                 onClick={fetchSingerSongDetails}
//                 style={{ color: "black", fontWeight: "bold" }}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "Fetch Song Data"}
//               </button>
//             </div>
//           </div>

//           <div className="summary-box">
//             <h2>Active Users Summary</h2>
//             <div className="user-count">{activeUsersCount}</div>
//             <div className="summary-desc">
//               Active users in the selected date range
//             </div>
//             <div className="export-buttons">
//               <button
//                 onClick={exportDailyActiveUsers}
//                 className="export-button"
//                 disabled={dailyActiveUsers.length === 0}
//                 title="Export daily active users data for selected date range"
//               >
//                 Export Data (CSV)
//               </button>
//               <button
//                 onClick={exportAllUsersData}
//                 className="export-button"
//                 disabled={!rawApiData}
//                 title="Export all API data as CSV"
//               >
//                 Export All Data (CSV)
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="charts-grid">
//           {/* Daily Active Users Chart */}
//           <div className="chart-container">
//             <h2>Daily Active Users</h2>
//             <div className="chart">
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart
//                   data={dailyActiveUsers}
//                   margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis
//                     dataKey="date"
//                     angle={-45}
//                     textAnchor="end"
//                     height={70}
//                     interval={10}
//                   />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Bar
//                     dataKey="activeUsers"
//                     fill="#8884d8"
//                     name="Active Users"
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           {/* User Growth Chart */}
//           <div className="chart-container">
//             <h2>User Growth</h2>
//             <div className="chart">
//               <ResponsiveContainer width="100%" height={300}>
//                 <AreaChart
//                   data={userCreationData}
//                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Area
//                     type="monotone"
//                     dataKey="newUsers"
//                     fill="#82ca9d"
//                     stroke="#82ca9d"
//                     name="New Users"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           {/* Monthly Active Users Chart */}
//           <div className="chart-container">
//             <h2>Monthly Active Users</h2>
//             <div className="chart">
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart
//                   data={monthlyActivityData}
//                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Line
//                     type="monotone"
//                     dataKey="activeUsers"
//                     stroke="#8884d8"
//                     activeDot={{ r: 8 }}
//                     name="Active Users"
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           {/* User Activity Summary */}
//           <div className="chart-container">
//             <h2>User Activity Summary</h2>
//             <div className="chart">
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart
//                   data={monthlyActivityData}
//                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                   layout="vertical"
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis type="number" />
//                   <YAxis dataKey="month" type="category" width={100} />
//                   <Tooltip />
//                   <Legend />
//                   <Bar
//                     dataKey="activeUsers"
//                     fill="#8884d8"
//                     name="Active Users"
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Reports;


// // // import React, { useState, useEffect } from 'react';
// // // import {
// // //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
// // //   LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
// // // } from 'recharts';
// // // import './Reports.css'; // Make sure to import your existing CSS file

// // // const Reports = () => {
// // //   const [userData, setUserData] = useState([]);
// // //   const [loading, setLoading] = useState(false);
// // //   const [dateRange, setDateRange] = useState({
// // //     startDate: '2024-11-01',
// // //     endDate: '2025-03-05'
// // //   });
// // //   const [activeUsersCount, setActiveUsersCount] = useState(0);
// // //   const [dailyActiveUsers, setDailyActiveUsers] = useState([]);
// // //   const [userCreationData, setUserCreationData] = useState([]);
// // //   const [monthlyActivityData, setMonthlyActivityData] = useState([]);

// // //   const parseActivityDate = (day, month, year) => {
// // //     // Make sure all parts are treated as integers and create UTC date
// // //     return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
// // //   };

// // //   // Fetch data from API
// // //   const fetchAllReports = async () => {
// // //     setLoading(true);

// // //     try {
// // //       const response = await fetch('https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_all_userData');
// // //       if (!response.ok) {
// // //         throw new Error('Failed to fetch All Reports');
// // //       }
// // //       const data = await response.json();
// // //       console.log(data);

// // //       // Process the fetched data
// // //       processUserData(data);
// // //       setLoading(false);
// // //     } catch (error) {
// // //       console.error('Error fetching data:', error);
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const processUserData = (data) => {
// // //     if (!data || !data.users) return;

// // //     const users = data.users;
// // //     setUserData(users);

// // //     // Convert date strings to UTC dates to avoid timezone issues
// // //     const startDate = new Date(Date.UTC(
// // //       parseInt(dateRange.startDate.split('-')[0]),
// // //       parseInt(dateRange.startDate.split('-')[1]) - 1,
// // //       parseInt(dateRange.startDate.split('-')[2])
// // //     ));

// // //     const endDate = new Date(Date.UTC(
// // //       parseInt(dateRange.endDate.split('-')[0]),
// // //       parseInt(dateRange.endDate.split('-')[1]) - 1,
// // //       parseInt(dateRange.endDate.split('-')[2]),
// // //       23, 59, 59 // Set to end of day
// // //     ));

// // //     // Rest of your function stays the same, but update the date parsing:
// // //     const activeUsers = users.filter(user => {
// // //       let hasActivityInRange = false;

// // //       const monthYearKeys = Object.keys(user).filter(key =>
// // //         /[A-Za-z]{3}\s\d{4}/.test(key)
// // //       );

// // //       monthYearKeys.forEach(monthYear => {
// // //         if (user[monthYear] && user[monthYear].M) {
// // //           Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
// // //             const [day, monthStr, yearStr] = dayKey.split('/');
// // //             // Use the consistent date parsing function
// // //             const dateObj = parseActivityDate(day, monthStr, yearStr);

// // //             if (dateObj >= startDate && dateObj <= endDate && parseInt(value.N) > 0) {
// // //               hasActivityInRange = true;
// // //             }
// // //           });
// // //         }
// // //       });

// // //       return hasActivityInRange;
// // //     });

// // //     setActiveUsersCount(activeUsers.length);

// // //     // Also update date handling in other function calls
// // //     const dailyData = generateDailyActivityData(users, startDate, endDate);
// // //     setDailyActiveUsers(dailyData);

// // //   // Create user creation data by month
// // //   const creationData = generateUserCreationData(users);
// // //   setUserCreationData(creationData);

// // //   // Create monthly activity data
// // //   const monthlyData = generateMonthlyActivityData(users);
// // //   setMonthlyActivityData(monthlyData);
// // // };

// // // const generateDailyActivityData = (users, startDate, endDate) => {
// // //     // Create a map for each day in the range
// // //     const dailyMap = new Map();

// // //     // Initialize the map with all dates in range
// // //     const currentDate = new Date(startDate);
// // //     while (currentDate <= endDate) {
// // //       const dateStr = currentDate.toISOString().split('T')[0];
// // //       dailyMap.set(dateStr, { date: dateStr, activeUsers: 0 });
// // //       currentDate.setDate(currentDate.getDate() + 1);
// // //     }

// // //     // Count active users for each day
// // //     users.forEach(user => {
// // //       const monthYearKeys = Object.keys(user).filter(key =>
// // //         /[A-Za-z]{3}\s\d{4}/.test(key)
// // //       );

// // //       monthYearKeys.forEach(month => {
// // //         if (user[month] && user[month].M) {
// // //           Object.entries(user[month].M).forEach(([dayKey, value]) => {
// // //             const [day, monthStr, yearStr] = dayKey.split('/');
// // //             // Use the consistent date parsing function
// // //             const dateObj = parseActivityDate(day, monthStr, yearStr);

// // //             if (dateObj >= startDate && dateObj <= endDate && parseInt(value.N) > 0) {
// // //               const dateStr = dateObj.toISOString().split('T')[0];
// // //               const dayData = dailyMap.get(dateStr);
// // //               if (dayData) {
// // //                 dailyMap.set(dateStr, {
// // //                   ...dayData,
// // //                   activeUsers: dayData.activeUsers + 1
// // //                 });
// // //               }
// // //             }
// // //           });
// // //         }
// // //       });
// // //     });

// // //     return Array.from(dailyMap.values());
// // //   };

// // // // Function to generate user creation data
// // // const generateUserCreationData = (users) => {
// // //     // Get all unique month/year combinations from user data
// // //     const monthlyCreation = new Map();

// // //     // Collect all month/year keys from all users
// // //     const allMonthYearKeys = new Set();
// // //     users.forEach(user => {
// // //       Object.keys(user).forEach(key => {
// // //         if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
// // //           allMonthYearKeys.add(key);
// // //         }
// // //       });
// // //     });

// // //     // Initialize the monthly creation object with all possible months
// // //     Array.from(allMonthYearKeys).sort((a, b) => {
// // //       const [monthA, yearA] = a.split(' ');
// // //       const [monthB, yearB] = b.split(' ');

// // //       if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

// // //       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// // //       return months.indexOf(monthA) - months.indexOf(monthB);
// // //     }).forEach(key => {
// // //       monthlyCreation.set(key, 0);
// // //     });

// // //     // Count user creations
// // //     users.forEach(user => {
// // //       if (user.created && user.created.S) {
// // //         const created = user.created.S;
// // //         const year = created.substring(0, 4);
// // //         const month = created.substring(4, 6);

// // //         // Convert numeric month to month name
// // //         const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// // //         const monthName = monthNames[parseInt(month) - 1];
// // //         const monthYear = `${monthName} ${year}`;

// // //         if (monthlyCreation.has(monthYear)) {
// // //           monthlyCreation.set(monthYear, monthlyCreation.get(monthYear) + 1);
// // //         }
// // //       }
// // //     });

// // //     return Array.from(monthlyCreation.entries()).map(([month, count]) => ({
// // //       month,
// // //       newUsers: count
// // //     }));
// // //   };

// // // // Function to generate monthly activity data
// // // const generateMonthlyActivityData = (users) => {
// // //     // Dynamically find all unique month/year keys across all users
// // //     const allMonthYearKeys = new Set();

// // //     users.forEach(user => {
// // //       Object.keys(user).forEach(key => {
// // //         if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
// // //           allMonthYearKeys.add(key);
// // //         }
// // //       });
// // //     });

// // //     // Initialize monthly activity count object
// // //     const monthlyActivity = new Map();

// // //     // Sort month/year keys chronologically
// // //     Array.from(allMonthYearKeys).sort((a, b) => {
// // //       const [monthA, yearA] = a.split(' ');
// // //       const [monthB, yearB] = b.split(' ');

// // //       if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

// // //       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// // //       return months.indexOf(monthA) - months.indexOf(monthB);
// // //     }).forEach(monthYear => {
// // //       monthlyActivity.set(monthYear, 0);
// // //     });

// // //     // For each user, count if they had activity in each month
// // //     users.forEach(user => {
// // //       Array.from(monthlyActivity.keys()).forEach(monthYear => {
// // //         if (user[monthYear] && user[monthYear].M) {
// // //           // This user had activity in this month
// // //           monthlyActivity.set(monthYear, monthlyActivity.get(monthYear) + 1);
// // //         }
// // //       });
// // //     });

// // //     return Array.from(monthlyActivity.entries()).map(([month, count]) => ({
// // //       month,
// // //       activeUsers: count
// // //     }));
// // //   };

// // //   useEffect(() => {
// // //     // Load data on component mount
// // //     fetchAllReports();
// // //   }, []);

// // // // Update data when date range changes
// // // useEffect(() => {
// // //     if (userData.length > 0) {
// // //       // Convert date strings to UTC dates to avoid timezone issues
// // //       const startDate = new Date(Date.UTC(
// // //         parseInt(dateRange.startDate.split('-')[0]),
// // //         parseInt(dateRange.startDate.split('-')[1]) - 1,
// // //         parseInt(dateRange.startDate.split('-')[2])
// // //       ));

// // //       const endDate = new Date(Date.UTC(
// // //         parseInt(dateRange.endDate.split('-')[0]),
// // //         parseInt(dateRange.endDate.split('-')[1]) - 1,
// // //         parseInt(dateRange.endDate.split('-')[2]),
// // //         23, 59, 59 // Set to end of day
// // //       ));

// // //       const activeUsers = userData.filter(user => {
// // //         let hasActivityInRange = false;

// // //         const monthYearKeys = Object.keys(user).filter(key =>
// // //           /[A-Za-z]{3}\s\d{4}/.test(key)
// // //         );

// // //         monthYearKeys.forEach(monthYear => {
// // //           if (user[monthYear] && user[monthYear].M) {
// // //             Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
// // //               const [day, monthStr, yearStr] = dayKey.split('/');
// // //               // Use the consistent date parsing function
// // //               const dateObj = parseActivityDate(day, monthStr, yearStr);

// // //               if (dateObj >= startDate && dateObj <= endDate && parseInt(value.N) > 0) {
// // //                 hasActivityInRange = true;
// // //               }
// // //             });
// // //           }
// // //         });

// // //         return hasActivityInRange;
// // //       });

// // //       setActiveUsersCount(activeUsers.length);

// // //       const dailyData = generateDailyActivityData(userData, startDate, endDate);
// // //       setDailyActiveUsers(dailyData);
// // //     }
// // //   }, [dateRange, userData]);

// // //   const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

// // //   return (
// // //     <div className="PageReport">
// // //       <div className="dashboard-container">
// // //         <div className="header">
// // //           <h1>User Activity Dashboard</h1>

// // //           <div className="date-controls">
// // //             <div className="date-field">
// // //               <label htmlFor="startDate">Start Date</label>
// // //               <input
// // //                 type="date"
// // //                 id="startDate"
// // //                 value={dateRange.startDate}
// // //                 onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
// // //               />
// // //             </div>
// // //             <div className="date-field">
// // //               <label htmlFor="endDate">End Date</label>
// // //               <input
// // //                 type="date"
// // //                 id="endDate"
// // //                 value={dateRange.endDate}
// // //                 onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
// // //               />
// // //             </div>
// // //             <div className="button-container">
// // //               <button
// // //                 onClick={fetchAllReports}
// // //                 style={{color: "black", fontWeight: 'bold'}}
// // //                 disabled={loading}
// // //               >
// // //                 {loading ? 'Loading...' : 'Generate Reports'}
// // //               </button>
// // //             </div>
// // //           </div>

// // //           <div className="summary-box">
// // //             <h2>Active Users Summary</h2>
// // //             <div className="user-count">{activeUsersCount}</div>
// // //             <div className="summary-desc">Active users in the selected date range</div>
// // //             </div>
// // //         </div>

// // //         <div className="charts-grid">
// // //           {/* Daily Active Users Chart */}
// // //           <div className="chart-container">
// // //             <h2>Daily Active Users</h2>
// // //             <div className="chart">
// // //               <ResponsiveContainer width="100%" height={300}>
// // //                 <BarChart
// // //                   data={dailyActiveUsers}
// // //                   margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
// // //                 >
// // //                   <CartesianGrid strokeDasharray="3 3" />
// // //                   <XAxis
// // //                     dataKey="date"
// // //                     angle={-45}
// // //                     textAnchor="end"
// // //                     height={70}
// // //                     interval={10}
// // //                   />
// // //                   <YAxis />
// // //                   <Tooltip />
// // //                   <Legend />
// // //                   <Bar dataKey="activeUsers" fill="#8884d8" name="Active Users" />
// // //                 </BarChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>

// // //           {/* User Growth Chart */}
// // //           <div className="chart-container">
// // //             <h2>User Growth</h2>
// // //             <div className="chart">
// // //               <ResponsiveContainer width="100%" height={300}>
// // //                 <AreaChart
// // //                   data={userCreationData}
// // //                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
// // //                 >
// // //                   <CartesianGrid strokeDasharray="3 3" />
// // //                   <XAxis dataKey="month" />
// // //                   <YAxis />
// // //                   <Tooltip />
// // //                   <Legend />
// // //                   <Area type="monotone" dataKey="newUsers" fill="#82ca9d" stroke="#82ca9d" name="New Users" />
// // //                 </AreaChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>

// // //           {/* Monthly Active Users Chart */}
// // //           <div className="chart-container">
// // //             <h2>Monthly Active Users</h2>
// // //             <div className="chart">
// // //               <ResponsiveContainer width="100%" height={300}>
// // //                 <LineChart
// // //                   data={monthlyActivityData}
// // //                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
// // //                 >
// // //                   <CartesianGrid strokeDasharray="3 3" />
// // //                   <XAxis dataKey="month" />
// // //                   <YAxis />
// // //                   <Tooltip />
// // //                   <Legend />
// // //                   <Line
// // //                     type="monotone"
// // //                     dataKey="activeUsers"
// // //                     stroke="#8884d8"
// // //                     activeDot={{ r: 8 }}
// // //                     name="Active Users"
// // //                   />
// // //                 </LineChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>

// // //           {/* User Activity Summary */}
// // //           <div className="chart-container">
// // //             <h2>User Activity Summary</h2>
// // //             <div className="chart">
// // //               <ResponsiveContainer width="100%" height={300}>
// // //                 <BarChart
// // //                   data={monthlyActivityData}
// // //                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
// // //                   layout="vertical"
// // //                 >
// // //                   <CartesianGrid strokeDasharray="3 3" />
// // //                   <XAxis type="number" />
// // //                   <YAxis dataKey="month" type="category" width={100} />
// // //                   <Tooltip />
// // //                   <Legend />
// // //                   <Bar dataKey="activeUsers" fill="#8884d8" name="Active Users" />
// // //                 </BarChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default Reports;

// // import React, { useState, useEffect } from "react";
// // import {
// //   BarChart,
// //   Bar,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   Legend,
// //   ResponsiveContainer,
// //   LineChart,
// //   Line,
// //   PieChart,
// //   Pie,
// //   Cell,
// //   AreaChart,
// //   Area,
// // } from "recharts";
// // import "./Reports.css"; // Make sure to import your existing CSS file
// // import * as XLSX from "xlsx";

// // const Reports = () => {
// //   const [userData, setUserData] = useState([]);
// //   const [rawApiData, setRawApiData] = useState(null);
// //   const [loading, setLoading] = useState(false);
// //   const [dateRange, setDateRange] = useState({
// //     startDate: "2024-11-01",
// //     endDate: "2025-03-05",
// //   });
// //   const [activeUsersCount, setActiveUsersCount] = useState(0);
// //   const [dailyActiveUsers, setDailyActiveUsers] = useState([]);
// //   const [userCreationData, setUserCreationData] = useState([]);
// //   const [monthlyActivityData, setMonthlyActivityData] = useState([]);
// //   const [deviceData, setDeviceData] = useState(null);

// //   const parseActivityDate = (day, month, year) => {
// //     // Make sure all parts are treated as integers and create UTC date
// //     return new Date(
// //       Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
// //     );
// //   };

// //   // New function to fetch device data from API
// //   const fetchDeviceData = async () => {
// //     setLoading(true);

// //     try {
// //       const response = await fetch(
// //         "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_user_device_details"
// //       );
// //       if (!response.ok) {
// //         throw new Error("Failed to fetch Device Reports");
// //       }
// //       const data = await response.json();
// //       console.log("Device data:", data);

// //       // Store the device data
// //       setDeviceData(data);

// //       // Export the data immediately
// //       exportDeviceData(data);

// //       setLoading(false);
// //     } catch (error) {
// //       console.error("Error fetching device data:", error);
// //       setLoading(false);
// //       alert("Error fetching device data: " + error.message);
// //     }
// //   };

// //   // Function to export device data as CSV
// //   // const exportDeviceData = (data) => {
// //   //   if (!data || !data.users || data.users.length === 0) {
// //   //     alert('No device data available.');
// //   //     return;
// //   //   }

// //   //   // Create CSV header
// //   //   let csvContent = 'user_id,Signup_with,EmailId,lastLogin\n';

// //   //   // Add data rows
// //   //   data.users.forEach(user => {
// //   //     // Escape fields that might contain commas
// //   //     const emailId = user.EmailId ? `"${user.EmailId.replace(/"/g, '""')}"` : '""';
// //   //     const device  = user.device ? `"${user.device.replace(/"/g, '""')}"` : '""';
// //   //     const lastLogin = user.lastLogin ? `"${user.lastLogin.replace(/"/g, '""')}"` : '""';

// //   //     csvContent += `${user.user_id || ''},${device},${emailId},${lastLogin}\n`;
// //   //   });

// //   //   // Create a Blob with the CSV content
// //   //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

// //   //   // Create a download link and trigger the download
// //   //   const link = document.createElement('a');
// //   //   const url = URL.createObjectURL(blob);
// //   //   link.setAttribute('href', url);
// //   //   link.setAttribute('download', `device_report_${new Date().toISOString().split('T')[0]}.csv`);
// //   //   link.style.visibility = 'hidden';
// //   //   document.body.appendChild(link);
// //   //   link.click();
// //   //   document.body.removeChild(link);
// //   // };

// //   // Function to export device data as CSV
// // const exportDeviceData = (data) => {
// //   if (!data || !data.users || data.users.length === 0) {
// //     alert("No device data available.");
// //     return;
// //   }

// //   // Filter users to only include those with a valid FullName
// //   const filteredUsers = data.users.filter(user => {
// //     const fullName = user.FullName || "";
// //     return fullName.trim() !== "";
// //   });

// //   if (filteredUsers.length === 0) {
// //     alert("No user data available with valid Full Name.");
// //     return;
// //   }

// //   // Create CSV header with the requested sequence
// //   let csvContent =
// //     "user_id,FullName,StageName,Category,Gender,Age,EmailId,PhoneNumber,registrationDate,createdTimestamp,updatedTimestamp,Signup_with,lastLogin\n";

// //   // Helper function to safely convert values to strings and escape them for CSV
// //   const safeString = (value) => {
// //     if (value === null || value === undefined) return '""';

// //     // Handle the case where StageName is an object with S property
// //     if (typeof value === "object" && value !== null) {
// //       if (value.S !== undefined) {
// //         value = value.S;
// //       } else {
// //         value = JSON.stringify(value);
// //       }
// //     }

// //     // Convert to string and escape quotes
// //     return `"${String(value).replace(/"/g, '""')}"`;
// //   };

// //   // Add data rows
// //   filteredUsers.forEach((user) => {
// //     // Process each field with the safeString helper in the requested sequence
// //     const userId = user.user_id || "";
// //     const fullName = safeString(user.FullName);
// //     const stageName = safeString(user.StageName);
// //     const category = safeString(user.Category);
// //     const gender = safeString(user.Gender);
// //     const age = user.Age || "";
// //     const emailId = safeString(user.EmailId);
// //     const phoneNumber = safeString(user.PhoneNumber);
// //     const regDate = safeString(user.registrationDate);
// //     const createdTime = safeString(user.createdTimestamp);
// //     const updatedTime = safeString(user.updatedTimestamp);
// //     const device = safeString(user.device);
// //     const lastLogin = safeString(user.lastLogin);

// //     csvContent += `${userId},${fullName},${stageName},${category},${gender},${age},${emailId},${phoneNumber},${regDate},${createdTime},${updatedTime},${device},${lastLogin}\n`;
// //   });

// //   // Create a Blob with the CSV content
// //   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

// //   // Create a download link and trigger the download
// //   const link = document.createElement("a");
// //   const url = URL.createObjectURL(blob);
// //   link.setAttribute("href", url);
// //   link.setAttribute(
// //     "download",
// //     `user_details_report_${new Date().toISOString().split("T")[0]}.csv`
// //   );
// //   link.style.visibility = "hidden";
// //   document.body.appendChild(link);
// //   link.click();
// //   document.body.removeChild(link);
// // };

// //   // Fetch data from API
// //   const fetchAllReports = async () => {
// //     setLoading(true);

// //     try {
// //       const response = await fetch(
// //         "https://knjixc4wse.execute-api.ap-south-1.amazonaws.com/admin_report/get_all_userData"
// //       );
// //       if (!response.ok) {
// //         throw new Error("Failed to fetch All Reports");
// //       }
// //       const data = await response.json();
// //       console.log(data);

// //       // Store the raw API response for export functionality
// //       setRawApiData(data);

// //       // Process the fetched data
// //       processUserData(data);
// //       setLoading(false);
// //     } catch (error) {
// //       console.error("Error fetching data:", error);
// //       setLoading(false);
// //     }
// //   };

// //   const processUserData = (data) => {
// //     if (!data || !data.users) return;
  
// //     const users = data.users;
// //     setUserData(users);
  
// //     // Convert date strings to UTC dates to avoid timezone issues
// //     const startDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.startDate.split("-")[0]),
// //         parseInt(dateRange.startDate.split("-")[1]) - 1,
// //         parseInt(dateRange.startDate.split("-")[2])
// //       )
// //     );
  
// //     const endDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.endDate.split("-")[0]),
// //         parseInt(dateRange.endDate.split("-")[1]) - 1,
// //         parseInt(dateRange.endDate.split("-")[2]),
// //         23,
// //         59,
// //         59 // Set to end of day
// //       )
// //     );
  
// //     // Filter for active users within the date range
// //     const activeUsersInRange = users.filter((user) => {
// //       let hasActivityInRange = false;
  
// //       const monthYearKeys = Object.keys(user).filter((key) =>
// //         /[A-Za-z]{3}\s\d{4}/.test(key)
// //       );
  
// //       monthYearKeys.forEach((monthYear) => {
// //         if (user[monthYear] && user[monthYear].M) {
// //           Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
// //             const [day, monthStr, yearStr] = dayKey.split("/");
// //             // Use the consistent date parsing function
// //             const dateObj = parseActivityDate(day, monthStr, yearStr);
  
// //             if (
// //               dateObj >= startDate &&
// //               dateObj <= endDate &&
// //               parseInt(value.N) > 0
// //             ) {
// //               hasActivityInRange = true;
// //             }
// //           });
// //         }
// //       });
  
// //       return hasActivityInRange;
// //     });
  
// //     // Further filter to only include users with a valid Full Name
// //     const activeUsers = activeUsersInRange.filter(user => {
// //       const fullName = user.FullName || "";
// //       return fullName.trim() !== "";
// //     });
  
// //     // Set the count of active users with valid Full Name
// //     setActiveUsersCount(activeUsers.length);
  
// //     // Also update date handling in other function calls
// //     // For daily active users graph, we should also only count users with a Full Name
// //     const dailyData = generateDailyActivityData(activeUsers, startDate, endDate);
// //     setDailyActiveUsers(dailyData);
  
// //     // Create user creation data by month - only for users with Full Name
// //     const creationData = generateUserCreationData(users.filter(user => {
// //       const fullName = user.FullName || "";
// //       return fullName.trim() !== "";
// //     }));
// //     setUserCreationData(creationData);
  
// //     // Create monthly activity data - only for users with Full Name
// //     const monthlyData = generateMonthlyActivityData(users.filter(user => {
// //       const fullName = user.FullName || "";
// //       return fullName.trim() !== "";
// //     }));
// //     setMonthlyActivityData(monthlyData);
// //   };
  

// //   const generateDailyActivityData = (users, startDate, endDate) => {
// //     // Create a map for each day in the range
// //     const dailyMap = new Map();
  
// //     // Initialize the map with all dates in range
// //     const currentDate = new Date(startDate);
// //     while (currentDate <= endDate) {
// //       const dateStr = currentDate.toISOString().split("T")[0];
// //       dailyMap.set(dateStr, { date: dateStr, activeUsers: 0 });
// //       currentDate.setDate(currentDate.getDate() + 1);
// //     }
  
// //     // Count active users for each day
// //     // Note: We expect 'users' to already be filtered for those with a valid Full Name
// //     users.forEach((user) => {
// //       const monthYearKeys = Object.keys(user).filter((key) =>
// //         /[A-Za-z]{3}\s\d{4}/.test(key)
// //       );
  
// //       monthYearKeys.forEach((month) => {
// //         if (user[month] && user[month].M) {
// //           Object.entries(user[month].M).forEach(([dayKey, value]) => {
// //             const [day, monthStr, yearStr] = dayKey.split("/");
// //             // Use the consistent date parsing function
// //             const dateObj = parseActivityDate(day, monthStr, yearStr);
  
// //             if (
// //               dateObj >= startDate &&
// //               dateObj <= endDate &&
// //               parseInt(value.N) > 0
// //             ) {
// //               const dateStr = dateObj.toISOString().split("T")[0];
// //               const dayData = dailyMap.get(dateStr);
// //               if (dayData) {
// //                 dailyMap.set(dateStr, {
// //                   ...dayData,
// //                   activeUsers: dayData.activeUsers + 1,
// //                 });
// //               }
// //             }
// //           });
// //         }
// //       });
// //     });
  
// //     return Array.from(dailyMap.values());
// //   };

// //   const generateUserCreationData = (users) => {
// //     // Convert startDate and endDate to actual Date objects
// //     const startDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.startDate.split("-")[0]),
// //         parseInt(dateRange.startDate.split("-")[1]) - 1,
// //         1 // First day of the start month
// //       )
// //     );

// //     const endDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.endDate.split("-")[0]),
// //         parseInt(dateRange.endDate.split("-")[1]) - 1,
// //         31, // Last day of the end month
// //         23,
// //         59,
// //         59 // Set to end of day
// //       )
// //     );

// //     // Initialize the monthly creation object
// //     const monthlyCreation = new Map();

// //     // Collect user creations within the date range
// //     users.forEach((user) => {
// //       if (user.created && user.created.S) {
// //         const created = user.created.S;
// //         const year = created.substring(0, 4);
// //         const month = created.substring(4, 6);

// //         // Convert numeric month to month name
// //         const monthNames = [
// //           "Jan",
// //           "Feb",
// //           "Mar",
// //           "Apr",
// //           "May",
// //           "Jun",
// //           "Jul",
// //           "Aug",
// //           "Sep",
// //           "Oct",
// //           "Nov",
// //           "Dec",
// //         ];
// //         const monthName = monthNames[parseInt(month) - 1];
// //         const monthYear = `${monthName} ${year}`;

// //         // Convert user creation date to Date object
// //         const userCreationDate = new Date(
// //           Date.UTC(
// //             parseInt(year),
// //             parseInt(month) - 1,
// //             1 // First day of the month
// //           )
// //         );

// //         // Check if user creation is within the selected date range
// //         if (userCreationDate >= startDate && userCreationDate <= endDate) {
// //           monthlyCreation.set(
// //             monthYear,
// //             (monthlyCreation.get(monthYear) || 0) + 1
// //           );
// //         }
// //       }
// //     });

// //     // Convert to sorted array
// //     return Array.from(monthlyCreation.entries())
// //       .map(([month, count]) => ({
// //         month,
// //         newUsers: count,
// //       }))
// //       .sort((a, b) => {
// //         const monthOrder = [
// //           "Jan",
// //           "Feb",
// //           "Mar",
// //           "Apr",
// //           "May",
// //           "Jun",
// //           "Jul",
// //           "Aug",
// //           "Sep",
// //           "Oct",
// //           "Nov",
// //           "Dec",
// //         ];
// //         const [monthA, yearA] = a.month.split(" ");
// //         const [monthB, yearB] = b.month.split(" ");

// //         if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
// //         return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
// //       });
// //   };

// //   const generateMonthlyActivityData = (users) => {
// //     // Convert startDate and endDate to actual Date objects
// //     const startDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.startDate.split("-")[0]),
// //         parseInt(dateRange.startDate.split("-")[1]) - 1,
// //         1 // First day of the start month
// //       )
// //     );

// //     const endDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.endDate.split("-")[0]),
// //         parseInt(dateRange.endDate.split("-")[1]) - 1,
// //         31, // Last day of the end month
// //         23,
// //         59,
// //         59 // Set to end of day
// //       )
// //     );

// //     // Initialize monthly activity count object
// //     const monthlyActivity = new Map();

// //     // Dynamically find all unique month/year keys across all users
// //     const allMonthYearKeys = new Set();

// //     users.forEach((user) => {
// //       Object.keys(user).forEach((key) => {
// //         if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
// //           allMonthYearKeys.add(key);
// //         }
// //       });
// //     });

// //     // Sort and filter month/year keys chronologically within the date range
// //     const sortedMonthYears = Array.from(allMonthYearKeys)
// //       .sort((a, b) => {
// //         const [monthA, yearA] = a.split(" ");
// //         const [monthB, yearB] = b.split(" ");

// //         const months = [
// //           "Jan",
// //           "Feb",
// //           "Mar",
// //           "Apr",
// //           "May",
// //           "Jun",
// //           "Jul",
// //           "Aug",
// //           "Sep",
// //           "Oct",
// //           "Nov",
// //           "Dec",
// //         ];

// //         if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
// //         return months.indexOf(monthA) - months.indexOf(monthB);
// //       })
// //       .filter((monthYear) => {
// //         const [month, year] = monthYear.split(" ");
// //         const monthDate = new Date(
// //           Date.UTC(
// //             parseInt(year),
// //             [
// //               "Jan",
// //               "Feb",
// //               "Mar",
// //               "Apr",
// //               "May",
// //               "Jun",
// //               "Jul",
// //               "Aug",
// //               "Sep",
// //               "Oct",
// //               "Nov",
// //               "Dec",
// //             ].indexOf(month),
// //             1 // First day of the month
// //           )
// //         );

// //         return monthDate >= startDate && monthDate <= endDate;
// //       });

// //     // Initialize the filtered month/years
// //     sortedMonthYears.forEach((monthYear) => {
// //       monthlyActivity.set(monthYear, 0);
// //     });

// //     // For each user, count if they had activity in each month within the range
// //     users.forEach((user) => {
// //       Array.from(monthlyActivity.keys()).forEach((monthYear) => {
// //         if (user[monthYear] && user[monthYear].M) {
// //           // This user had activity in this month
// //           monthlyActivity.set(monthYear, monthlyActivity.get(monthYear) + 1);
// //         }
// //       });
// //     });

// //     return Array.from(monthlyActivity.entries()).map(([month, count]) => ({
// //       month,
// //       activeUsers: count,
// //     }));
// //   };

// //   // Function to export daily active users data as CSV
// //   // const exportDailyActiveUsers = () => {
// //   //   if (!dailyActiveUsers || dailyActiveUsers.length === 0) {
// //   //     alert('No daily active users data available. Please generate reports first.');
// //   //     return;
// //   //   }

// //   //   // Create CSV content
// //   //   let csvContent = 'date,activeUsers\n';

// //   //   dailyActiveUsers.forEach(day => {
// //   //     csvContent += `${day.date},${day.activeUsers}\n`;
// //   //   });

// //   //   // Create a Blob with the CSV content
// //   //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

// //   //   // Create a download link and trigger the download
// //   //   const link = document.createElement('a');
// //   //   const url = URL.createObjectURL(blob);
// //   //   link.setAttribute('href', url);
// //   //   link.setAttribute('download', `daily_active_users_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
// //   //   link.style.visibility = 'hidden';
// //   //   document.body.appendChild(link);
// //   //   link.click();
// //   //   document.body.removeChild(link);
// //   // };

// //   // Function to export daily active users data
// // const exportDailyActiveUsers = () => {
// //   if (!dailyActiveUsers || dailyActiveUsers.length === 0) {
// //     alert(
// //       "No daily active users data available. Please generate reports first."
// //     );
// //     return;
// //   }

// //   // Convert date strings to UTC dates to avoid timezone issues
// //   const startDate = new Date(
// //     Date.UTC(
// //       parseInt(dateRange.startDate.split("-")[0]),
// //       parseInt(dateRange.startDate.split("-")[1]) - 1,
// //       parseInt(dateRange.startDate.split("-")[2])
// //     )
// //   );

// //   const endDate = new Date(
// //     Date.UTC(
// //       parseInt(dateRange.endDate.split("-")[0]),
// //       parseInt(dateRange.endDate.split("-")[1]) - 1,
// //       parseInt(dateRange.endDate.split("-")[2]),
// //       23,
// //       59,
// //       59 // Set to end of day
// //     )
// //   );

// //   // Filter active users within the date range
// //   const allActiveUsers = userData.filter((user) => {
// //     let hasActivityInRange = false;

// //     const monthYearKeys = Object.keys(user).filter((key) =>
// //       /[A-Za-z]{3}\s\d{4}/.test(key)
// //     );

// //     monthYearKeys.forEach((monthYear) => {
// //       if (user[monthYear] && user[monthYear].M) {
// //         Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
// //           const [day, monthStr, yearStr] = dayKey.split("/");
// //           const dateObj = parseActivityDate(day, monthStr, yearStr);

// //           if (
// //             dateObj >= startDate &&
// //             dateObj <= endDate &&
// //             parseInt(value.N) > 0
// //           ) {
// //             hasActivityInRange = true;
// //           }
// //         });
// //       }
// //     });

// //     return hasActivityInRange;
// //   });
  
// //   // Further filter to only include users with a valid FullName
// //   const activeUsers = allActiveUsers.filter(user => {
// //     const fullName = user.FullName || "";
// //     return fullName.trim() !== "";
// //   });

// //   // Helper function to safely convert values to strings and escape them for CSV
// //   const safeString = (value) => {
// //     if (value === null || value === undefined) return '';
    
// //     // Handle the case where the value is an object with S property
// //     if (typeof value === "object" && value !== null) {
// //       if (value.S !== undefined) {
// //         value = value.S;
// //       } else {
// //         value = JSON.stringify(value);
// //       }
// //     }
    
// //     // Convert to string and escape quotes for CSV
// //     return String(value).replace(/"/g, '""');
// //   };

// //   // Create a new workbook and add worksheets
// //   const wb = XLSX.utils.book_new();

// //   // Prepare Daily Active Users data
// //   const dailyActiveUsersSheet = dailyActiveUsers.map((day) => ({
// //     Date: day.date,
// //     "Active Users": day.activeUsers,
// //   }));

// //   // Prepare Active Users Details with requested column sequence
// //   const activeUsersDetailsSheet = activeUsers.map((user) => ({
// //     "ID": safeString(user.user_id?.S || ""),
// //     "Full Name": safeString(user.FullName || ""),
// //     "Gender": safeString(user.Gender || ""),
// //     "Age": safeString(user.Age || ""),
// //     "Sign up": safeString(user.device || ""),
// //     "Last login": safeString(user.lastLogin || "")
// //   }));

// //   // Add Daily Active Users sheet
// //   const dailyWs = XLSX.utils.json_to_sheet(dailyActiveUsersSheet);
// //   XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Active Users");

// //   // Add Active Users Details sheet
// //   const usersWs = XLSX.utils.json_to_sheet(activeUsersDetailsSheet);
// //   XLSX.utils.book_append_sheet(wb, usersWs, "Active Users Details");

// //   // Export the workbook
// //   XLSX.writeFile(
// //     wb,
// //     `active_users_report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`
// //   );
// // };

// //   // Function to export all API data as CSV
// //   // const exportAllUsersData = () => {
// //   //   if (!rawApiData || !rawApiData.users || rawApiData.users.length === 0) {
// //   //     alert('No API data available. Please generate reports first.');
// //   //     return;
// //   //   }

// //   //   const users = rawApiData.users;

// //   //   // Get all possible month/year combinations across all users
// //   //   const allMonthYearKeys = new Set();
// //   //   users.forEach(user => {
// //   //     Object.keys(user).forEach(key => {
// //   //       if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
// //   //         allMonthYearKeys.add(key);
// //   //       }
// //   //     });
// //   //   });

// //   //   // Sort the month/year keys chronologically
// //   //   const sortedMonthYears = Array.from(allMonthYearKeys).sort((a, b) => {
// //   //     const [monthA, yearA] = a.split(' ');
// //   //     const [monthB, yearB] = b.split(' ');

// //   //     if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

// //   //     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// //   //     return months.indexOf(monthA) - months.indexOf(monthB);
// //   //   });

// //   //   // Collect all standard fields that aren't month/year keys
// //   //   const standardFields = ["user_id", "created", "lastActive"];

// //   //   // Create CSV header
// //   //   let csvContent = '"user_id","created",';

// //   //   // Add month/year columns to header
// //   //   sortedMonthYears.forEach(monthYear => {
// //   //     csvContent += `"${monthYear}",`;
// //   //   });

// //   //   // Add lastActive at the end and remove trailing comma
// //   //   csvContent = csvContent.slice(0, -1) + '\n';

// //   //   // Add data rows
// //   //   users.forEach(user => {
// //   //     // Add user_id
// //   //     csvContent += `"${user.user_id?.S || ''}",`;

// //   //     // Add created date
// //   //     csvContent += `"${user.created?.S || ''}",`;

// //   //     // Add data for each month/year
// //   //     sortedMonthYears.forEach(monthYear => {
// //   //       if (user[monthYear] && user[monthYear].M) {
// //   //         // Stringify the month's activity data
// //   //         const activityData = JSON.stringify(user[monthYear].M).replace(/"/g, '""');
// //   //         csvContent += `"${activityData}",`;
// //   //       } else {
// //   //         csvContent += '"",';
// //   //       }
// //   //     });

// //   //     // Add lastActive and remove trailing comma
// //   //     csvContent += `"${user.lastActive?.S || ''}"\n`;
// //   //   });

// //   //   // Create a Blob with the CSV content
// //   //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

// //   //   // Create a download link and trigger the download
// //   //   const link = document.createElement('a');
// //   //   const url = URL.createObjectURL(blob);
// //   //   link.setAttribute('href', url);
// //   //   link.setAttribute('download', 'all_users_data.csv');
// //   //   link.style.visibility = 'hidden';
// //   //   document.body.appendChild(link);
// //   //   link.click();
// //   //   document.body.removeChild(link);
// //   // };

// //   // Function to export all API data as CSV
// // // Function to export all API data as CSV
// // const exportAllUsersData = () => {
// //   if (!rawApiData || !rawApiData.users || rawApiData.users.length === 0) {
// //     alert("No API data available. Please generate reports first.");
// //     return;
// //   }

// //   // Filter users to only include those with valid user_id and FullName
// //   const users = rawApiData.users.filter(user => {
// //     const userId = user.user_id?.S || "";
// //     const fullName = user.FullName || "";
    
// //     // Only include users that have both user_id and FullName
// //     return userId.trim() !== "" && fullName.trim() !== "";
// //   });
  
// //   if (users.length === 0) {
// //     alert("No valid user data available with both user_id and FullName.");
// //     return;
// //   }

// //   // Get all possible month/year combinations across all users
// //   const allMonthYearKeys = new Set();
// //   users.forEach((user) => {
// //     Object.keys(user).forEach((key) => {
// //       if (/[A-Za-z]{3}\s\d{4}/.test(key)) {
// //         allMonthYearKeys.add(key);
// //       }
// //     });
// //   });

// //   // Sort the month/year keys chronologically
// //   const sortedMonthYears = Array.from(allMonthYearKeys).sort((a, b) => {
// //     const [monthA, yearA] = a.split(" ");
// //     const [monthB, yearB] = b.split(" ");

// //     if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);

// //     const months = [
// //       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
// //       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
// //     ];
// //     return months.indexOf(monthA) - months.indexOf(monthB);
// //   });

// //   // Helper function to safely convert values to strings and escape them for CSV
// //   const safeString = (value) => {
// //     if (value === null || value === undefined) return '""';

// //     // Handle the case where the value is an object with S property
// //     if (typeof value === "object" && value !== null) {
// //       if (value.S !== undefined) {
// //         value = value.S;
// //       } else {
// //         value = JSON.stringify(value);
// //       }
// //     }

// //     // Convert to string and escape quotes
// //     return `"${String(value).replace(/"/g, '""')}"`;
// //   };

// //   // Create CSV header with the requested sequence
// //   let csvContent = '"Id","Name","Gender","Age","Sign up with","Created timestamp","Last login",';

// //   // Add month/year columns to header
// //   sortedMonthYears.forEach((monthYear) => {
// //     csvContent += `"${monthYear}",`;
// //   });

// //   // Remove trailing comma and add newline
// //   csvContent = csvContent.slice(0, -1) + "\n";

// //   // Add data rows
// //   users.forEach((user) => {
// //     // Process fields in the requested sequence
// //     const userId = safeString(user.user_id?.S || "");
// //     const fullName = safeString(user.FullName || "");
// //     const gender = safeString(user.Gender || "");
// //     const age = safeString(user.Age || "");
// //     const signUpWith = safeString(user.device || "");
// //     const createdTimestamp = safeString(user.createdTimestamp || user.created?.S || "");
// //     const lastLogin = safeString(user.lastLogin || "");

// //     // Add the user data in the requested sequence
// //     csvContent += `${userId},${fullName},${gender},${age},${signUpWith},${createdTimestamp},${lastLogin},`;

// //     // Add data for each month/year
// //     sortedMonthYears.forEach((monthYear) => {
// //       if (user[monthYear] && user[monthYear].M) {
// //         // Stringify the month's activity data
// //         const activityData = JSON.stringify(user[monthYear].M).replace(
// //           /"/g,
// //           '""'
// //         );
// //         csvContent += `"${activityData}",`;
// //       } else {
// //         csvContent += '"",';
// //       }
// //     });

// //     // Remove trailing comma and add newline
// //     csvContent = csvContent.slice(0, -1) + `\n`;
// //   });

// //   // Create a Blob with the CSV content
// //   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

// //   // Create a download link and trigger the download
// //   const link = document.createElement("a");
// //   const url = URL.createObjectURL(blob);
// //   link.setAttribute("href", url);
// //   link.setAttribute("download", "all_users_data.csv");
// //   link.style.visibility = "hidden";
// //   document.body.appendChild(link);
// //   link.click();
// //   document.body.removeChild(link);
// // };

// //   useEffect(() => {
// //     // Load data on component mount
// //     fetchAllReports();
// //   }, []);

// //  // Update data when date range changes
// // useEffect(() => {
// //   if (userData.length > 0) {
// //     // Convert date strings to UTC dates to avoid timezone issues
// //     const startDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.startDate.split("-")[0]),
// //         parseInt(dateRange.startDate.split("-")[1]) - 1,
// //         parseInt(dateRange.startDate.split("-")[2])
// //       )
// //     );

// //     const endDate = new Date(
// //       Date.UTC(
// //         parseInt(dateRange.endDate.split("-")[0]),
// //         parseInt(dateRange.endDate.split("-")[1]) - 1,
// //         parseInt(dateRange.endDate.split("-")[2]),
// //         23,
// //         59,
// //         59 // Set to end of day
// //       )
// //     );

// //     // Filter for active users within the date range first
// //     const activeUsersInRange = userData.filter((user) => {
// //       let hasActivityInRange = false;

// //       const monthYearKeys = Object.keys(user).filter((key) =>
// //         /[A-Za-z]{3}\s\d{4}/.test(key)
// //       );

// //       monthYearKeys.forEach((monthYear) => {
// //         if (user[monthYear] && user[monthYear].M) {
// //           Object.entries(user[monthYear].M).forEach(([dayKey, value]) => {
// //             const [day, monthStr, yearStr] = dayKey.split("/");
// //             // Use the consistent date parsing function
// //             const dateObj = parseActivityDate(day, monthStr, yearStr);

// //             if (
// //               dateObj >= startDate &&
// //               dateObj <= endDate &&
// //               parseInt(value.N) > 0
// //             ) {
// //               hasActivityInRange = true;
// //             }
// //           });
// //         }
// //       });

// //       return hasActivityInRange;
// //     });

// //     // Further filter to only include users with a valid Full Name
// //     const activeUsers = activeUsersInRange.filter(user => {
// //       const fullName = user.FullName || "";
// //       return fullName.trim() !== "";
// //     });

// //     // Set the count of active users with valid Full Name
// //     setActiveUsersCount(activeUsers.length);

// //     // Generate daily active users data - only from users with a valid Full Name
// //     const dailyData = generateDailyActivityData(activeUsers, startDate, endDate);
// //     setDailyActiveUsers(dailyData);
// //   }
// // }, [dateRange, userData]);

// //   const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];

// //   return (
// //     <div className="PageReport">
// //       <div className="dashboard-container">
// //         <div className="header">
// //           <h1>User Activity Dashboard</h1>

// //           <div className="date-controls">
// //             <div className="date-field">
// //               <label htmlFor="startDate">Start Date</label>
// //               <input
// //                 type="date"
// //                 id="startDate"
// //                 value={dateRange.startDate}
// //                 onChange={(e) =>
// //                   setDateRange({ ...dateRange, startDate: e.target.value })
// //                 }
// //               />
// //             </div>
// //             <div className="date-field">
// //               <label htmlFor="endDate">End Date</label>
// //               <input
// //                 type="date"
// //                 id="endDate"
// //                 value={dateRange.endDate}
// //                 onChange={(e) =>
// //                   setDateRange({ ...dateRange, endDate: e.target.value })
// //                 }
// //               />
// //             </div>
// //             <div className="button-container">
// //               <button
// //                 onClick={fetchAllReports}
// //                 style={{ color: "black", fontWeight: "bold" }}
// //                 disabled={loading}
// //               >
// //                 {loading ? "Loading..." : "Generate Reports"}
// //               </button>
// //             </div>
// //             <div className="button-container">
// //               <button
// //                 onClick={fetchDeviceData}
// //                 style={{ color: "black", fontWeight: "bold" }}
// //                 disabled={loading}
// //               >
// //                 {loading ? "Loading..." : "User Details"}
// //               </button>
// //             </div>
// //           </div>

// //           <div className="summary-box">
// //             <h2>Active Users Summary</h2>
// //             <div className="user-count">{activeUsersCount}</div>
// //             <div className="summary-desc">
// //               Active users in the selected date range
// //             </div>
// //             <div className="export-buttons">
// //               <button
// //                 onClick={exportDailyActiveUsers}
// //                 className="export-button"
// //                 disabled={dailyActiveUsers.length === 0}
// //                 title="Export daily active users data for selected date range"
// //               >
// //                 Export Data (CSV)
// //               </button>
// //               <button
// //                 onClick={exportAllUsersData}
// //                 className="export-button"
// //                 disabled={!rawApiData}
// //                 title="Export all API data as CSV"
// //               >
// //                 Export All Data (CSV)
// //               </button>
// //             </div>
// //           </div>
// //         </div>

// //         <div className="charts-grid">
// //           {/* Daily Active Users Chart */}
// //           <div className="chart-container">
// //             <h2>Daily Active Users</h2>
// //             <div className="chart">
// //               <ResponsiveContainer width="100%" height={300}>
// //                 <BarChart
// //                   data={dailyActiveUsers}
// //                   margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
// //                 >
// //                   <CartesianGrid strokeDasharray="3 3" />
// //                   <XAxis
// //                     dataKey="date"
// //                     angle={-45}
// //                     textAnchor="end"
// //                     height={70}
// //                     interval={10}
// //                   />
// //                   <YAxis />
// //                   <Tooltip />
// //                   <Legend />
// //                   <Bar
// //                     dataKey="activeUsers"
// //                     fill="#8884d8"
// //                     name="Active Users"
// //                   />
// //                 </BarChart>
// //               </ResponsiveContainer>
// //             </div>
// //           </div>

// //           {/* User Growth Chart */}
// //           <div className="chart-container">
// //             <h2>User Growth</h2>
// //             <div className="chart">
// //               <ResponsiveContainer width="100%" height={300}>
// //                 <AreaChart
// //                   data={userCreationData}
// //                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
// //                 >
// //                   <CartesianGrid strokeDasharray="3 3" />
// //                   <XAxis dataKey="month" />
// //                   <YAxis />
// //                   <Tooltip />
// //                   <Legend />
// //                   <Area
// //                     type="monotone"
// //                     dataKey="newUsers"
// //                     fill="#82ca9d"
// //                     stroke="#82ca9d"
// //                     name="New Users"
// //                   />
// //                 </AreaChart>
// //               </ResponsiveContainer>
// //             </div>
// //           </div>

// //           {/* Monthly Active Users Chart */}
// //           <div className="chart-container">
// //             <h2>Monthly Active Users</h2>
// //             <div className="chart">
// //               <ResponsiveContainer width="100%" height={300}>
// //                 <LineChart
// //                   data={monthlyActivityData}
// //                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
// //                 >
// //                   <CartesianGrid strokeDasharray="3 3" />
// //                   <XAxis dataKey="month" />
// //                   <YAxis />
// //                   <Tooltip />
// //                   <Legend />
// //                   <Line
// //                     type="monotone"
// //                     dataKey="activeUsers"
// //                     stroke="#8884d8"
// //                     activeDot={{ r: 8 }}
// //                     name="Active Users"
// //                   />
// //                 </LineChart>
// //               </ResponsiveContainer>
// //             </div>
// //           </div>

// //           {/* User Activity Summary */}
// //           <div className="chart-container">
// //             <h2>User Activity Summary</h2>
// //             <div className="chart">
// //               <ResponsiveContainer width="100%" height={300}>
// //                 <BarChart
// //                   data={monthlyActivityData}
// //                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
// //                   layout="vertical"
// //                 >
// //                   <CartesianGrid strokeDasharray="3 3" />
// //                   <XAxis type="number" />
// //                   <YAxis dataKey="month" type="category" width={100} />
// //                   <Tooltip />
// //                   <Legend />
// //                   <Bar
// //                     dataKey="activeUsers"
// //                     fill="#8884d8"
// //                     name="Active Users"
// //                   />
// //                 </BarChart>
// //               </ResponsiveContainer>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Reports;
