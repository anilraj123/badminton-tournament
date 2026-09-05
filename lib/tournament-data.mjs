// =============================================================
// TOURNAMENT DATA — Kerala Ecumenical Churches of Bay Area
// Ecumenical Badminton Tournament 2026 · Sat 9/5 · Elite Badminton Center, Union City
//
// GENERATED FROM the committee's master schedule spreadsheet
// "Ecumenical Badminton Tournament 2026 - Schedule for Upload"
// (Google Sheets id 1pWRLEL51t1fBrlEtgGs8GV15iS0amiFoAIfFJvP19HU, owner satish.david@gmail.com)
// Tab 1 "Consolidated Schedule", 144 matches, as of 2026-09-05 01:40 UTC.
//
// THE SHEET IS THE SOURCE OF TRUTH. This file mirrors it. Match ids are the
// sheet's own Match # (sheet row 82 -> id 'm82'), so anything printed from the
// sheet lines up with the site. NOTE: the committee renumbered the sheet in the
// 01:40 revision, so ids from any earlier print-out no longer line up.
//
// This revision resolved every defect in the earlier draw — the four moves were:
//   WD-B  Cheryl George & Sarah Samji v Merlin Cherian & Ancy Varghese
//                                     11:45 court 13 -> court 9
//   MD-B  VIVIN JOY & Sojan PR v Binu John & Aju Philip
//                                     11:45 court 14 -> court 10
//   MD-B  VIVIN JOY & Sojan PR v Reebu Kurian & Noah Paul
//                                     12:45 court 111 (typo) -> court 11
//   MD-C  Jerin Thomas George & Robin Davis v Naveen Therathanath & Santosh Abhraham
//                                     10:30 court 16 -> 1:15pm court 9
//                                     (cleared Robin Davis's 10:30 clash with MXD-B)
// Verified against this revision: no court double-bookings, no player
// double-bookings, all 12 group round-robins complete.
//
// FORMAT (per the official flyer; the sheet does not state set counts):
//   MD  Men's Doubles   4 groups (A-D) x 6 teams   · games to 21
//   MS  Men's Singles   4 groups (A-D) x 4 players · games to 21
//   WD  Women's Doubles Group A x 5, Group B x 4   · games to 15
//   MXD Mixed Doubles   2 groups (A-B) x 5 teams   · games to 15
//   Round robin; top 2 advance. Prelims & QF: ONE set. SF, Final & 3rd Place: THREE sets.
//   MXD and WD have no QF — group winners/runners-up go straight to the semifinals.
//
// Courts 9-16. Group play 9:00am-1:30pm in 15-minute slots; finals end 3:00pm.
//
// The one deliberate departure from the sheet's text is spelling: two people are
// spelled two ways there and are unified here. See NAME_ALIASES at the bottom.
//
// After the sheet changes: regenerate this file, then `npm run seed`.
// =============================================================

// Points to win per category (deuce caps are umpire-enforced)
const FORMAT = { MD: 21, MS: 21, WD: 15, MXD: 15 };

export const GROUPS = {
  MD: {
    'Group A': [
      'Rajeev Samuel & Zacharia P',
      'Jacob Pradeesh & Luke Subin',
      'Anil Raj Gopalakrishnan & Linesh John',
      'Abin Chenkal John & Paul William',
      'Jibin Thomas & Joby Varghese',
      'Sandeep Roy & Rajiv Kochumman',
    ],
    'Group B': [
      'DEEPAK LAL & NISHANT GEORGE',
      'Binu John & Aju Philip',
      'Allen Paul & Biju Varghese',
      'George Kandathil & Kayson Neduvakkattu',
      'VIVIN JOY & Sojan PR',
      'Reebu Kurian & Noah Paul',
    ],
    'Group C': [
      'Abin Paul & Amal Thomas',
      'Naveen Therathanath & Santosh Abhraham',
      'Denis Biju & Kevin Matthews',
      'Jerin Thomas George & Robin Davis',
      'Liju John & Binoy Baby',
      'Rohan Jones & Rahul Jones',
    ],
    'Group D': [
      'Anit Kuruvilla & Joseph Kuttikat',
      'Jedediah Muthalaly & Luke Muthalaly',
      'Rateep Jose & Benny Anose',
      'Jojo john & Prince Mathew',
      'Sunny Abraham & Libin',
      'Shaun Peter & Don Samji',
    ],
  },
  MS: {
    'Group A': [
      'Rajeev Samuel',
      'Denis Biju',
      'Anil Raj Gopalakrishnan',
      'Joby Varghese',
    ],
    'Group B': [
      'Jovan George',
      'Kevin Cisto',
      'VIVIN JOY',
      'Jerin Thomas George',
    ],
    'Group C': [
      'Kevin Matthews',
      'Libin',
      'Abin Paul',
      'Ajin Kuriakose',
    ],
    'Group D': [
      'Sunny Abraham',
      'Jibin Thomas',
      'Roji Roy',
      'Rohan Jones',
    ],
  },
  WD: {
    'Group A': [
      'Soumya Valsan & Alishia Allen',
      'Joann Susan Subu & Abigail Anish',
      'Tintu Scaria & Sneha Liza George',
      'Lini Varghese & Roshini Philip',
      'Sruthi Rachel Thambi & Tessy Anicattu Mathew',
    ],
    'Group B': [
      'Merlin Cherian & Ancy Varghese',
      'Rekha Shoby & Sharon Jones',
      'Cheryl George & Sarah Samji',
      'Dale George & Anita Thomas',
    ],
  },
  MXD: {
    'Group A': [
      'Reebu Kurian & Dale George',
      'Paul William & Nisha Thomas',
      'Ajin Kuriakose & Neenu Jacob',
      'Shino Kurian & Sruthi Rachel Thambi',
      'Jijo John & Ancy Varghese',
    ],
    'Group B': [
      'Tintu Scaria & Robin Davis',
      'Naveen Therathanath & Lini Varghese',
      'Rajiv Kochumman & Tessy Anicattu Mathew',
      'Rohan Jones & Shweta Jones',
      'Don Samji & Cheryl George',
    ],
  },
};

// Every match, exactly as the sheet lists it: [sheet #, time, court, cat, stage, side1, side2]
const ROWS = [
  [1, '09:00', 9, 'MXD', 'Group A', 'Reebu Kurian & Dale George', 'Paul William & Nisha Thomas'],
  [2, '09:00', 10, 'MXD', 'Group A', 'Ajin Kuriakose & Neenu Jacob', 'Shino Kurian & Sruthi Rachel Thambi'],
  [3, '09:00', 11, 'MD', 'Group B', 'DEEPAK LAL & NISHANT GEORGE', 'Binu John & Aju Philip'],
  [4, '09:00', 12, 'MXD', 'Group B', 'Tintu Scaria & Robin Davis', 'Naveen Therathanath & Lini Varghese'],
  [5, '09:00', 13, 'MXD', 'Group B', 'Rajiv Kochumman & Tessy Anicattu Mathew', 'Rohan Jones & Shweta Jones'],
  [6, '09:00', 14, 'MS', 'Group A', 'Rajeev Samuel', 'Denis Biju'],
  [7, '09:00', 15, 'MS', 'Group A', 'Anil Raj Gopalakrishnan', 'Joby Varghese'],
  [8, '09:00', 16, 'MS', 'Group B', 'Jovan George', 'Kevin Cisto'],
  [9, '09:15', 9, 'MXD', 'Group A', 'Reebu Kurian & Dale George', 'Shino Kurian & Sruthi Rachel Thambi'],
  [10, '09:15', 10, 'MS', 'Group B', 'VIVIN JOY', 'Jerin Thomas George'],
  [11, '09:15', 11, 'MXD', 'Group A', 'Ajin Kuriakose & Neenu Jacob', 'Jijo John & Ancy Varghese'],
  [12, '09:15', 12, 'MXD', 'Group B', 'Don Samji & Cheryl George', 'Naveen Therathanath & Lini Varghese'],
  [13, '09:15', 13, 'MXD', 'Group B', 'Tintu Scaria & Robin Davis', 'Rohan Jones & Shweta Jones'],
  [14, '09:15', 14, 'MS', 'Group A', 'Rajeev Samuel', 'Anil Raj Gopalakrishnan'],
  [15, '09:15', 15, 'MS', 'Group A', 'Denis Biju', 'Joby Varghese'],
  [16, '09:15', 16, 'MS', 'Group C', 'Kevin Matthews', 'Libin'],
  [17, '09:30', 10, 'MS', 'Group D', 'Sunny Abraham', 'Jibin Thomas'],
  [18, '09:30', 11, 'MS', 'Group C', 'Abin Paul', 'Kevin Matthews'],
  [19, '09:30', 12, 'WD', 'Group A', 'Soumya Valsan & Alishia Allen', 'Joann Susan Subu & Abigail Anish'],
  [20, '09:30', 13, 'MD', 'Group B', 'Allen Paul & Biju Varghese', 'George Kandathil & Kayson Neduvakkattu'],
  [21, '09:30', 14, 'MD', 'Group D', 'Anit Kuruvilla & Joseph Kuttikat', 'Jedediah Muthalaly & Luke Muthalaly'],
  [22, '09:30', 15, 'MD', 'Group D', 'Rateep Jose & Benny Anose', 'Jojo john & Prince Mathew'],
  [23, '09:45', 9, 'WD', 'Group A', 'Tintu Scaria & Sneha Liza George', 'Soumya Valsan & Alishia Allen'],
  [24, '09:45', 10, 'MXD', 'Group A', 'Shino Kurian & Sruthi Rachel Thambi', 'Jijo John & Ancy Varghese'],
  [25, '09:45', 11, 'MXD', 'Group A', 'Paul William & Nisha Thomas', 'Ajin Kuriakose & Neenu Jacob'],
  [26, '09:45', 12, 'MXD', 'Group B', 'Rajiv Kochumman & Tessy Anicattu Mathew', 'Don Samji & Cheryl George'],
  [27, '09:45', 13, 'MXD', 'Group B', 'Rohan Jones & Shweta Jones', 'Naveen Therathanath & Lini Varghese'],
  [28, '09:45', 14, 'MS', 'Group A', 'Rajeev Samuel', 'Joby Varghese'],
  [29, '09:45', 15, 'MS', 'Group A', 'Denis Biju', 'Anil Raj Gopalakrishnan'],
  [30, '09:45', 16, 'MS', 'Group D', 'Jibin Thomas', 'Roji Roy'],
  [31, '10:00', 9, 'MXD', 'Group A', 'Reebu Kurian & Dale George', 'Jijo John & Ancy Varghese'],
  [32, '10:00', 11, 'MXD', 'Group A', 'Shino Kurian & Sruthi Rachel Thambi', 'Paul William & Nisha Thomas'],
  [33, '10:00', 12, 'MXD', 'Group B', 'Tintu Scaria & Robin Davis', 'Don Samji & Cheryl George'],
  [34, '10:00', 13, 'MXD', 'Group B', 'Rajiv Kochumman & Tessy Anicattu Mathew', 'Naveen Therathanath & Lini Varghese'],
  [35, '10:00', 14, 'MS', 'Group B', 'VIVIN JOY', 'Jovan George'],
  [36, '10:00', 15, 'MS', 'Group C', 'Abin Paul', 'Libin'],
  [37, '10:00', 16, 'MD', 'Group D', 'Anit Kuruvilla & Joseph Kuttikat', 'Rateep Jose & Benny Anose'],
  [38, '10:15', 9, 'MS', 'Group B', 'VIVIN JOY', 'Kevin Cisto'],
  [39, '10:15', 10, 'MS', 'Group D', 'Sunny Abraham', 'Roji Roy'],
  [40, '10:15', 11, 'MS', 'Group D', 'Jibin Thomas', 'Rohan Jones'],
  [41, '10:15', 12, 'MD', 'Group B', 'Binu John & Aju Philip', 'Allen Paul & Biju Varghese'],
  [42, '10:15', 13, 'MD', 'Group D', 'Jedediah Muthalaly & Luke Muthalaly', 'Jojo john & Prince Mathew'],
  [43, '10:15', 15, 'MD', 'Group A', 'Rajeev Samuel & Zacharia P', 'Jacob Pradeesh & Luke Subin'],
  [44, '10:15', 16, 'MD', 'Group B', 'George Kandathil & Kayson Neduvakkattu', 'DEEPAK LAL & NISHANT GEORGE'],
  [45, '10:30', 9, 'MXD', 'Group A', 'Reebu Kurian & Dale George', 'Ajin Kuriakose & Neenu Jacob'],
  [46, '10:30', 10, 'MXD', 'Group A', 'Jijo John & Ancy Varghese', 'Paul William & Nisha Thomas'],
  [47, '10:30', 12, 'MXD', 'Group B', 'Tintu Scaria & Robin Davis', 'Rajiv Kochumman & Tessy Anicattu Mathew'],
  [48, '10:30', 13, 'MXD', 'Group B', 'Don Samji & Cheryl George', 'Rohan Jones & Shweta Jones'],
  [49, '10:30', 14, 'MD', 'Group A', 'Anil Raj Gopalakrishnan & Linesh John', 'Jacob Pradeesh & Luke Subin'],
  [50, '10:45', 9, 'MS', 'Group C', 'Abin Paul', 'Ajin Kuriakose'],
  [51, '10:45', 10, 'MS', 'Group B', 'Jerin Thomas George', 'Kevin Cisto'],
  [52, '10:45', 11, 'MD', 'Group B', 'VIVIN JOY & Sojan PR', 'George Kandathil & Kayson Neduvakkattu'],
  [53, '10:45', 12, 'WD', 'Group B', 'Merlin Cherian & Ancy Varghese', 'Rekha Shoby & Sharon Jones'],
  [54, '10:45', 13, 'WD', 'Group A', 'Soumya Valsan & Alishia Allen', 'Lini Varghese & Roshini Philip'],
  [55, '10:45', 14, 'WD', 'Group B', 'Cheryl George & Sarah Samji', 'Dale George & Anita Thomas'],
  [56, '10:45', 15, 'MD', 'Group A', 'Rajeev Samuel & Zacharia P', 'Abin Chenkal John & Paul William'],
  [57, '10:45', 16, 'MD', 'Group B', 'DEEPAK LAL & NISHANT GEORGE', 'Reebu Kurian & Noah Paul'],
  [58, '11:00', 13, 'MXD', 'Semi Final 1', 'Winner Group A', 'Runner-up Group B'],
  [59, '11:00', 14, 'MXD', 'Semi Final 2', 'Winner Group B', 'Runner-up Group A'],
  [60, '11:00', 11, 'MS', 'Group D', 'Rohan Jones', 'Roji Roy'],
  [61, '11:00', 12, 'WD', 'Group A', 'Sruthi Rachel Thambi & Tessy Anicattu Mathew', 'Soumya Valsan & Alishia Allen'],
  [62, '11:00', 9, 'MD', 'Group A', 'Anil Raj Gopalakrishnan & Linesh John', 'Jibin Thomas & Joby Varghese'],
  [63, '11:00', 10, 'MD', 'Group C', 'Abin Paul & Amal Thomas', 'Naveen Therathanath & Santosh Abhraham'],
  [64, '11:00', 15, 'MD', 'Group D', 'Anit Kuruvilla & Joseph Kuttikat', 'Sunny Abraham & Libin'],
  [65, '11:00', 16, 'MD', 'Group B', 'VIVIN JOY & Sojan PR', 'Allen Paul & Biju Varghese'],
  [66, '11:15', 9, 'WD', 'Group A', 'Sruthi Rachel Thambi & Tessy Anicattu Mathew', 'Joann Susan Subu & Abigail Anish'],
  [67, '11:15', 10, 'MD', 'Group C', 'Naveen Therathanath & Santosh Abhraham', 'Denis Biju & Kevin Matthews'],
  [68, '11:15', 11, 'MS', 'Group B', 'Jerin Thomas George', 'Jovan George'],
  [69, '11:15', 12, 'MS', 'Group C', 'Ajin Kuriakose', 'Libin'],
  [70, '11:15', 13, 'MS', 'Group D', 'Sunny Abraham', 'Rohan Jones'],
  [71, '11:15', 14, 'WD', 'Group A', 'Tintu Scaria & Sneha Liza George', 'Lini Varghese & Roshini Philip'],
  [72, '11:15', 15, 'WD', 'Group B', 'Cheryl George & Sarah Samji', 'Rekha Shoby & Sharon Jones'],
  [73, '11:15', 16, 'MD', 'Group A', 'Rajeev Samuel & Zacharia P', 'Anil Raj Gopalakrishnan & Linesh John'],
  [74, '11:30', 9, 'MS', 'Group C', 'Ajin Kuriakose', 'Kevin Matthews'],
  [75, '11:30', 10, 'WD', 'Group A', 'Tintu Scaria & Sneha Liza George', 'Joann Susan Subu & Abigail Anish'],
  [76, '11:30', 11, 'MD', 'Group A', 'Jacob Pradeesh & Luke Subin', 'Jibin Thomas & Joby Varghese'],
  [77, '11:30', 12, 'WD', 'Group B', 'Merlin Cherian & Ancy Varghese', 'Dale George & Anita Thomas'],
  [78, '11:30', 13, 'MD', 'Group B', 'Reebu Kurian & Noah Paul', 'Allen Paul & Biju Varghese'],
  [79, '11:30', 14, 'MD', 'Group D', 'Rateep Jose & Benny Anose', 'Shaun Peter & Don Samji'],
  [80, '11:30', 15, 'MD', 'Group C', 'Jerin Thomas George & Robin Davis', 'Liju John & Binoy Baby'],
  [81, '11:30', 16, 'MD', 'Group A', 'Sandeep Roy & Rajiv Kochumman', 'Abin Chenkal John & Paul William'],
  [82, '11:45', 13, 'MXD', 'Championship Final', 'Winner SF1', 'Winner SF2'],
  [83, '11:45', 14, 'MXD', '3rd Place Match', 'Loser SF1', 'Loser SF2'],
  [84, '11:45', 11, 'MD', 'Group C', 'Abin Paul & Amal Thomas', 'Rohan Jones & Rahul Jones'],
  [85, '11:45', 12, 'WD', 'Group A', 'Sruthi Rachel Thambi & Tessy Anicattu Mathew', 'Lini Varghese & Roshini Philip'],
  [86, '11:45', 9, 'WD', 'Group B', 'Cheryl George & Sarah Samji', 'Merlin Cherian & Ancy Varghese'],
  [87, '11:45', 10, 'MD', 'Group B', 'VIVIN JOY & Sojan PR', 'Binu John & Aju Philip'],
  [88, '11:45', 15, 'MD', 'Group A', 'Rajeev Samuel & Zacharia P', 'Jibin Thomas & Joby Varghese'],
  [89, '11:45', 16, 'MD', 'Group D', 'Sunny Abraham & Libin', 'Shaun Peter & Don Samji'],
  [90, '12:00', 9, 'MD', 'Group C', 'Jerin Thomas George & Robin Davis', 'Denis Biju & Kevin Matthews'],
  [91, '12:00', 10, 'MD', 'Group C', 'Liju John & Binoy Baby', 'Rohan Jones & Rahul Jones'],
  [92, '12:00', 11, 'MS', 'Quarter Final 1', 'Winner Group A', 'Runner-up Group B'],
  [93, '12:00', 12, 'MS', 'Quarter Final 2', 'Winner Group C', 'Runner-up Group D'],
  [94, '12:00', 13, 'MS', 'Quarter Final 3', 'Winner Group B', 'Runner-up Group A'],
  [95, '12:00', 14, 'MS', 'Quarter Final 4', 'Winner Group D', 'Runner-up Group C'],
  [96, '12:00', 15, 'WD', 'Group A', 'Tintu Scaria & Sneha Liza George', 'Sruthi Rachel Thambi & Tessy Anicattu Mathew'],
  [97, '12:00', 16, 'WD', 'Group B', 'Dale George & Anita Thomas', 'Rekha Shoby & Sharon Jones'],
  [98, '12:15', 9, 'MD', 'Group A', 'Rajeev Samuel & Zacharia P', 'Sandeep Roy & Rajiv Kochumman'],
  [99, '12:15', 10, 'MD', 'Group A', 'Abin Chenkal John & Paul William', 'Jacob Pradeesh & Luke Subin'],
  [100, '12:15', 11, 'WD', 'Group A', 'Joann Susan Subu & Abigail Anish', 'Lini Varghese & Roshini Philip'],
  [101, '12:15', 12, 'MD', 'Group B', 'VIVIN JOY & Sojan PR', 'DEEPAK LAL & NISHANT GEORGE'],
  [102, '12:15', 13, 'MD', 'Group B', 'Reebu Kurian & Noah Paul', 'Binu John & Aju Philip'],
  [103, '12:15', 14, 'MD', 'Group C', 'Abin Paul & Amal Thomas', 'Denis Biju & Kevin Matthews'],
  [104, '12:15', 16, 'MD', 'Group D', 'Anit Kuruvilla & Joseph Kuttikat', 'Shaun Peter & Don Samji'],
  [105, '12:30', 13, 'MS', 'Semi Final 1', 'Winner QF1', 'Winner QF2'],
  [106, '12:30', 14, 'MS', 'Semi Final 2', 'Winner QF3', 'Winner QF4'],
  [107, '12:30', 11, 'MD', 'Group B', 'Allen Paul & Biju Varghese', 'DEEPAK LAL & NISHANT GEORGE'],
  [108, '12:30', 12, 'MD', 'Group C', 'Rohan Jones & Rahul Jones', 'Jerin Thomas George & Robin Davis'],
  [109, '12:30', 9, 'MD', 'Group C', 'Naveen Therathanath & Santosh Abhraham', 'Liju John & Binoy Baby'],
  [110, '12:30', 10, 'MD', 'Group D', 'Jedediah Muthalaly & Luke Muthalaly', 'Rateep Jose & Benny Anose'],
  [111, '12:30', 15, 'MD', 'Group D', 'Sunny Abraham & Libin', 'Jojo john & Prince Mathew'],
  [112, '12:30', 16, 'MD', 'Group A', 'Abin Chenkal John & Paul William', 'Anil Raj Gopalakrishnan & Linesh John'],
  [113, '12:45', 9, 'MD', 'Group B', 'Binu John & Aju Philip', 'George Kandathil & Kayson Neduvakkattu'],
  [114, '12:45', 13, 'WD', 'Semi Final 1', 'Winner Group A', 'Runner-up Group B'],
  [115, '12:45', 14, 'WD', 'Semi Final 2', 'Winner Group B', 'Runner-up Group A'],
  [116, '12:45', 10, 'MD', 'Group A', 'Sandeep Roy & Rajiv Kochumman', 'Anil Raj Gopalakrishnan & Linesh John'],
  [117, '12:45', 11, 'MD', 'Group B', 'VIVIN JOY & Sojan PR', 'Reebu Kurian & Noah Paul'],
  [118, '12:45', 16, 'MD', 'Group D', 'Anit Kuruvilla & Joseph Kuttikat', 'Jojo john & Prince Mathew'],
  [119, '13:00', 9, 'MD', 'Group A', 'Jibin Thomas & Joby Varghese', 'Abin Chenkal John & Paul William'],
  [120, '13:00', 10, 'MD', 'Group C', 'Rohan Jones & Rahul Jones', 'Naveen Therathanath & Santosh Abhraham'],
  [121, '13:00', 11, 'MD', 'Group C', 'Abin Paul & Amal Thomas', 'Jerin Thomas George & Robin Davis'],
  [122, '13:00', 14, 'MD', 'Group C', 'Denis Biju & Kevin Matthews', 'Liju John & Binoy Baby'],
  [123, '13:00', 16, 'MD', 'Group D', 'Jedediah Muthalaly & Luke Muthalaly', 'Sunny Abraham & Libin'],
  [124, '13:15', 9, 'MD', 'Group C', 'Jerin Thomas George & Robin Davis', 'Naveen Therathanath & Santosh Abhraham'],
  [125, '13:15', 13, 'MS', 'Championship Final', 'Winner SF1', 'Winner SF2'],
  [126, '13:15', 14, 'MS', '3rd Place Match', 'Loser SF1', 'Loser SF2'],
  [127, '13:15', 11, 'MD', 'Group A', 'Jibin Thomas & Joby Varghese', 'Sandeep Roy & Rajiv Kochumman'],
  [128, '13:15', 12, 'MD', 'Group B', 'George Kandathil & Kayson Neduvakkattu', 'Reebu Kurian & Noah Paul'],
  [129, '13:15', 10, 'MD', 'Group C', 'Abin Paul & Amal Thomas', 'Liju John & Binoy Baby'],
  [130, '13:15', 15, 'MD', 'Group D', 'Rateep Jose & Benny Anose', 'Sunny Abraham & Libin'],
  [131, '13:15', 16, 'MD', 'Group D', 'Shaun Peter & Don Samji', 'Jedediah Muthalaly & Luke Muthalaly'],
  [132, '13:30', 10, 'MD', 'Group A', 'Jacob Pradeesh & Luke Subin', 'Sandeep Roy & Rajiv Kochumman'],
  [133, '13:30', 13, 'WD', 'Championship Final', 'Winner SF1', 'Winner SF2'],
  [134, '13:30', 14, 'WD', '3rd Place Match', 'Loser SF1', 'Loser SF2'],
  [135, '13:30', 15, 'MD', 'Group C', 'Denis Biju & Kevin Matthews', 'Rohan Jones & Rahul Jones'],
  [136, '13:30', 16, 'MD', 'Group D', 'Shaun Peter & Don Samji', 'Jojo john & Prince Mathew'],
  [137, '13:45', 11, 'MD', 'Quarter Final 1', 'Winner Group A', 'Runner-up Group B'],
  [138, '13:45', 12, 'MD', 'Quarter Final 2', 'Winner Group C', 'Runner-up Group D'],
  [139, '13:45', 13, 'MD', 'Quarter Final 3', 'Winner Group B', 'Runner-up Group A'],
  [140, '13:45', 14, 'MD', 'Quarter Final 4', 'Winner Group D', 'Runner-up Group C'],
  [141, '14:15', 13, 'MD', 'Semi Final 1', 'Winner QF1', 'Winner QF2'],
  [142, '14:15', 14, 'MD', 'Semi Final 2', 'Winner QF3', 'Winner QF4'],
  [143, '15:00', 13, 'MD', 'Championship Final', 'Winner SF1', 'Winner SF2'],
  [144, '15:00', 14, 'MD', '3rd Place Match', 'Loser SF1', 'Loser SF2'],
];

export const SCHEDULE = [];
export const KNOCKOUT = {};

// Knockout wiring, keyed by the sheet's match number. A slot is { group, rank }
// (resolved from standings), { winnerOf: id } or { loserOf: id }.
const KO_WIRING = {
  58: { round: 'semi', label: 'Semifinal 1', slot1: {group:'Group A',rank:1}, slot2: {group:'Group B',rank:2}, name1: 'Winner Group A', name2: 'Runner-up Group B', sets: 3 },
  59: { round: 'semi', label: 'Semifinal 2', slot1: {group:'Group B',rank:1}, slot2: {group:'Group A',rank:2}, name1: 'Winner Group B', name2: 'Runner-up Group A', sets: 3 },
  82: { round: 'final', label: 'Final', slot1: {winnerOf:'m58'}, slot2: {winnerOf:'m59'}, name1: 'Winner SF1', name2: 'Winner SF2', sets: 3 },
  83: { round: 'third', label: '3rd Place', slot1: {loserOf:'m58'}, slot2: {loserOf:'m59'}, name1: 'Loser SF1', name2: 'Loser SF2', sets: 3 },
  92: { round: 'quarter', label: 'Quarterfinal 1', slot1: {group:'Group A',rank:1}, slot2: {group:'Group B',rank:2}, name1: 'Winner Group A', name2: 'Runner-up Group B', sets: 1 },
  93: { round: 'quarter', label: 'Quarterfinal 2', slot1: {group:'Group C',rank:1}, slot2: {group:'Group D',rank:2}, name1: 'Winner Group C', name2: 'Runner-up Group D', sets: 1 },
  94: { round: 'quarter', label: 'Quarterfinal 3', slot1: {group:'Group B',rank:1}, slot2: {group:'Group A',rank:2}, name1: 'Winner Group B', name2: 'Runner-up Group A', sets: 1 },
  95: { round: 'quarter', label: 'Quarterfinal 4', slot1: {group:'Group D',rank:1}, slot2: {group:'Group C',rank:2}, name1: 'Winner Group D', name2: 'Runner-up Group C', sets: 1 },
  105: { round: 'semi', label: 'Semifinal 1', slot1: {winnerOf:'m92'}, slot2: {winnerOf:'m93'}, name1: 'Winner QF1', name2: 'Winner QF2', sets: 3 },
  106: { round: 'semi', label: 'Semifinal 2', slot1: {winnerOf:'m94'}, slot2: {winnerOf:'m95'}, name1: 'Winner QF3', name2: 'Winner QF4', sets: 3 },
  114: { round: 'semi', label: 'Semifinal 1', slot1: {group:'Group A',rank:1}, slot2: {group:'Group B',rank:2}, name1: 'Winner Group A', name2: 'Runner-up Group B', sets: 3 },
  115: { round: 'semi', label: 'Semifinal 2', slot1: {group:'Group B',rank:1}, slot2: {group:'Group A',rank:2}, name1: 'Winner Group B', name2: 'Runner-up Group A', sets: 3 },
  125: { round: 'final', label: 'Final', slot1: {winnerOf:'m105'}, slot2: {winnerOf:'m106'}, name1: 'Winner SF1', name2: 'Winner SF2', sets: 3 },
  126: { round: 'third', label: '3rd Place', slot1: {loserOf:'m105'}, slot2: {loserOf:'m106'}, name1: 'Loser SF1', name2: 'Loser SF2', sets: 3 },
  133: { round: 'final', label: 'Final', slot1: {winnerOf:'m114'}, slot2: {winnerOf:'m115'}, name1: 'Winner SF1', name2: 'Winner SF2', sets: 3 },
  134: { round: 'third', label: '3rd Place', slot1: {loserOf:'m114'}, slot2: {loserOf:'m115'}, name1: 'Loser SF1', name2: 'Loser SF2', sets: 3 },
  137: { round: 'quarter', label: 'Quarterfinal 1', slot1: {group:'Group A',rank:1}, slot2: {group:'Group B',rank:2}, name1: 'Winner Group A', name2: 'Runner-up Group B', sets: 1 },
  138: { round: 'quarter', label: 'Quarterfinal 2', slot1: {group:'Group C',rank:1}, slot2: {group:'Group D',rank:2}, name1: 'Winner Group C', name2: 'Runner-up Group D', sets: 1 },
  139: { round: 'quarter', label: 'Quarterfinal 3', slot1: {group:'Group B',rank:1}, slot2: {group:'Group A',rank:2}, name1: 'Winner Group B', name2: 'Runner-up Group A', sets: 1 },
  140: { round: 'quarter', label: 'Quarterfinal 4', slot1: {group:'Group D',rank:1}, slot2: {group:'Group C',rank:2}, name1: 'Winner Group D', name2: 'Runner-up Group C', sets: 1 },
  141: { round: 'semi', label: 'Semifinal 1', slot1: {winnerOf:'m137'}, slot2: {winnerOf:'m138'}, name1: 'Winner QF1', name2: 'Winner QF2', sets: 3 },
  142: { round: 'semi', label: 'Semifinal 2', slot1: {winnerOf:'m139'}, slot2: {winnerOf:'m140'}, name1: 'Winner QF3', name2: 'Winner QF4', sets: 3 },
  143: { round: 'final', label: 'Final', slot1: {winnerOf:'m141'}, slot2: {winnerOf:'m142'}, name1: 'Winner SF1', name2: 'Winner SF2', sets: 3 },
  144: { round: 'third', label: '3rd Place', slot1: {loserOf:'m141'}, slot2: {loserOf:'m142'}, name1: 'Loser SF1', name2: 'Loser SF2', sets: 3 },
};

for (const [num, time, court, cat, stage, side1, side2] of ROWS) {
  const id = `m${num}`;
  const ko = KO_WIRING[num];
  if (!ko) {
    SCHEDULE.push({
      id, time, court, cat, p1: side1, p2: side2, umpire: 'TBD',
      isPlayoff: false, matchType: 'prelim', scoringFormat: FORMAT[cat],
      stage, label: `${cat} ${stage}`,
    });
    continue;
  }
  const base = {
    time, court, cat, p1: ko.name1, p2: ko.name2, umpire: 'TBD',
    isPlayoff: true, matchType: ko.round, scoringFormat: FORMAT[cat], stage,
  };
  if (ko.sets === 1) {
    SCHEDULE.push({ ...base, id, label: `${cat} ${ko.label}` });
  } else {
    for (let s = 1; s <= ko.sets; s++) {
      SCHEDULE.push({
        ...base, id: `${id}_s${s}`, label: `${cat} ${ko.label} - Set ${s}`,
        setNumber: s, parentMatchId: id,
      });
    }
  }
  KNOCKOUT[id] = { cat, round: ko.round, label: ko.label, slot1: ko.slot1, slot2: ko.slot2, sets: ko.sets };
}

// Doubles team -> its two players, so "My Matches" can find a player inside a team name.
export const TEAM_ROSTERS = {
  'Reebu Kurian & Dale George': ['Reebu Kurian', 'Dale George'],
  'Paul William & Nisha Thomas': ['Paul William', 'Nisha Thomas'],
  'Ajin Kuriakose & Neenu Jacob': ['Ajin Kuriakose', 'Neenu Jacob'],
  'Shino Kurian & Sruthi Rachel Thambi': ['Shino Kurian', 'Sruthi Rachel Thambi'],
  'DEEPAK LAL & NISHANT GEORGE': ['DEEPAK LAL', 'NISHANT GEORGE'],
  'Binu John & Aju Philip': ['Binu John', 'Aju Philip'],
  'Tintu Scaria & Robin Davis': ['Tintu Scaria', 'Robin Davis'],
  'Naveen Therathanath & Lini Varghese': ['Naveen Therathanath', 'Lini Varghese'],
  'Rajiv Kochumman & Tessy Anicattu Mathew': ['Rajiv Kochumman', 'Tessy Anicattu Mathew'],
  'Rohan Jones & Shweta Jones': ['Rohan Jones', 'Shweta Jones'],
  'Jijo John & Ancy Varghese': ['Jijo John', 'Ancy Varghese'],
  'Don Samji & Cheryl George': ['Don Samji', 'Cheryl George'],
  'Soumya Valsan & Alishia Allen': ['Soumya Valsan', 'Alishia Allen'],
  'Joann Susan Subu & Abigail Anish': ['Joann Susan Subu', 'Abigail Anish'],
  'Allen Paul & Biju Varghese': ['Allen Paul', 'Biju Varghese'],
  'George Kandathil & Kayson Neduvakkattu': ['George Kandathil', 'Kayson Neduvakkattu'],
  'Anit Kuruvilla & Joseph Kuttikat': ['Anit Kuruvilla', 'Joseph Kuttikat'],
  'Jedediah Muthalaly & Luke Muthalaly': ['Jedediah Muthalaly', 'Luke Muthalaly'],
  'Rateep Jose & Benny Anose': ['Rateep Jose', 'Benny Anose'],
  'Jojo john & Prince Mathew': ['Jojo john', 'Prince Mathew'],
  'Tintu Scaria & Sneha Liza George': ['Tintu Scaria', 'Sneha Liza George'],
  'Rajeev Samuel & Zacharia P': ['Rajeev Samuel', 'Zacharia P'],
  'Jacob Pradeesh & Luke Subin': ['Jacob Pradeesh', 'Luke Subin'],
  'Anil Raj Gopalakrishnan & Linesh John': ['Anil Raj Gopalakrishnan', 'Linesh John'],
  'VIVIN JOY & Sojan PR': ['VIVIN JOY', 'Sojan PR'],
  'Merlin Cherian & Ancy Varghese': ['Merlin Cherian', 'Ancy Varghese'],
  'Rekha Shoby & Sharon Jones': ['Rekha Shoby', 'Sharon Jones'],
  'Lini Varghese & Roshini Philip': ['Lini Varghese', 'Roshini Philip'],
  'Cheryl George & Sarah Samji': ['Cheryl George', 'Sarah Samji'],
  'Dale George & Anita Thomas': ['Dale George', 'Anita Thomas'],
  'Abin Chenkal John & Paul William': ['Abin Chenkal John', 'Paul William'],
  'Reebu Kurian & Noah Paul': ['Reebu Kurian', 'Noah Paul'],
  'Sruthi Rachel Thambi & Tessy Anicattu Mathew': ['Sruthi Rachel Thambi', 'Tessy Anicattu Mathew'],
  'Jibin Thomas & Joby Varghese': ['Jibin Thomas', 'Joby Varghese'],
  'Abin Paul & Amal Thomas': ['Abin Paul', 'Amal Thomas'],
  'Naveen Therathanath & Santosh Abhraham': ['Naveen Therathanath', 'Santosh Abhraham'],
  'Sunny Abraham & Libin': ['Sunny Abraham', 'Libin'],
  'Denis Biju & Kevin Matthews': ['Denis Biju', 'Kevin Matthews'],
  'Shaun Peter & Don Samji': ['Shaun Peter', 'Don Samji'],
  'Jerin Thomas George & Robin Davis': ['Jerin Thomas George', 'Robin Davis'],
  'Liju John & Binoy Baby': ['Liju John', 'Binoy Baby'],
  'Sandeep Roy & Rajiv Kochumman': ['Sandeep Roy', 'Rajiv Kochumman'],
  'Rohan Jones & Rahul Jones': ['Rohan Jones', 'Rahul Jones'],
};

export const CAT_LABELS = {
  MD: "Men's Doubles",
  MS: "Men's Singles",
  WD: "Women's Doubles",
  MXD: "Mixed Doubles",
};

// NAME_ALIASES — the sheet's alternate spellings, mapped to the name used here.
// Two people are spelled two ways in the sheet, which split each of them into two
// separate competitors. Both are unified above, so a person's "My Matches" shows
// every fixture across every category they entered:
//   'kevin mathews' (MS Group C)  -> 'Kevin Matthews'        (as spelled in MD Group C)
//   'Tessy Mathew'  (MXD Group B) -> 'Tessy Anicattu Mathew' (as spelled in WD Group A)
// Spelling is the ONE thing this file knowingly changes from the sheet's text.
// These entries keep the sheet's spelling resolving too.
//
// NOT merged, CONFIRMED: 'Jijo John' (MXD Group A, with Ancy Varghese) and
// 'Jojo john' (MD Group D, with Prince Mathew) differ by one letter but are two
// different people. Confirmed 2026-09-04 — do not "helpfully" merge them.
export const NAME_ALIASES = {
  'kevin mathews': 'Kevin Matthews',
  'Tessy Mathew': 'Tessy Anicattu Mathew',
};

export const ADVANCE_PER_GROUP = { MD: 2, MS: 2, WD: 2, MXD: 2 };

// Legacy 3-set semi/final system — unused; the KNOCKOUT bracket above replaces it.
export const PLAYOFF_STRUCTURE = {};
export const FINALS_STRUCTURE = {};
