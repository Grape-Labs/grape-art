import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

import{
    Box,
    Typography,
    Grid,
} from '@mui/material';

const minuteSeconds = 60;
const hourSeconds = 3600;
const daySeconds = 86400;

const timerProps = {
  isPlaying: true,
  size: 120,
  strokeWidth: 6
};

const renderTime = (dimension:any, time:any) => {
  return (
    <div className="time-wrapper">
        <div className="time">
            <Typography variant='h4'>
                {time}
            </Typography>
        </div>
        <div>{dimension}</div>
    </div>
  );
};

const getTimeSeconds = (time:any) => (minuteSeconds - time) | 0;
const getTimeMinutes = (time:any) => ((time % hourSeconds) / minuteSeconds) | 0;
const getTimeHours = (time:any) => ((time % daySeconds) / hourSeconds) | 0;
const getTimeDays = (time:any) => (time / daySeconds) | 0;

export function CountdownView(props:any) {
    const countdown = props?.countdown;
    const edate = new Date(countdown);
    const startTime =  Math.floor(Date.now() / 1000);// use UNIX timestamp in seconds
    const etime =  Math.floor(edate.getTime() / 1000);
    const endTime = etime;//startTime + etime; // use UNIX timestamp in seconds
    
    const remainingTime = endTime - startTime;
    const days = Math.ceil(remainingTime / daySeconds);
    const daysDuration = days * daySeconds;

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <Grid 
                container
            >
                <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" justifyContent="center">
                        <CountdownCircleTimer
                        {...timerProps}
                        colors="#7E2E84"
                        duration={daysDuration}
                        initialRemainingTime={remainingTime}
                        >
                        {({ elapsedTime, color }) => (
                            <span style={{ color }}>
                            {renderTime("days", getTimeDays(daysDuration - elapsedTime))}
                            </span>
                        )}
                        </CountdownCircleTimer>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" justifyContent="center">
                        <CountdownCircleTimer
                        {...timerProps}
                        colors="#D14081"
                        duration={daySeconds}
                        initialRemainingTime={remainingTime % daySeconds}
                        onComplete={(totalElapsedTime) => ({
                            shouldRepeat: remainingTime - totalElapsedTime > hourSeconds
                        })}
                        >
                        {({ elapsedTime, color }) => (
                            <span style={{ color }}>
                            {renderTime("hours", getTimeHours(daySeconds - elapsedTime))}
                            </span>
                        )}
                        </CountdownCircleTimer>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" justifyContent="center">
                        <CountdownCircleTimer
                        {...timerProps}
                        colors="#EF798A"
                        duration={hourSeconds}
                        initialRemainingTime={remainingTime % hourSeconds}
                        onComplete={(totalElapsedTime) => ({
                            shouldRepeat: remainingTime - totalElapsedTime > minuteSeconds
                        })}
                        >
                        {({ elapsedTime, color }) => (
                            <span style={{ color }}>
                            {renderTime("minutes", getTimeMinutes(hourSeconds - elapsedTime))}
                            </span>
                        )}
                        </CountdownCircleTimer>
                    </Box>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Box display="flex" justifyContent="center">
                        <CountdownCircleTimer
                        {...timerProps}
                        colors="#218380"
                        duration={minuteSeconds}
                        initialRemainingTime={remainingTime % minuteSeconds}
                        onComplete={(totalElapsedTime) => ({
                            shouldRepeat: remainingTime - totalElapsedTime > 0
                        })}
                        >
                        {({ elapsedTime, color }) => (
                            <span style={{ color }}>
                            {renderTime("seconds", getTimeSeconds(elapsedTime))}
                            </span>
                        )}
                        </CountdownCircleTimer>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
