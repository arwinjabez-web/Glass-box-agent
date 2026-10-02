(= (check-attendance $attendance)
   (if (> $attendance 85)
       "Your attendance is greater than 85. You can attend your exam\nELIGIBLE"
       "Your attendance is 85 or below. You cannot attend your exam\nNOT_ELIGIBLE"))    