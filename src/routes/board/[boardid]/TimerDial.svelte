<script>
    import {onDestroy} from "svelte"

    const FULL_DASH_ARRAY = 283;
    const WARNING_THRESHOLD = 10;
    const ALERT_THRESHOLD = 5;
    
    const COLOR_CODES = {
        info: {
            color: "green"
        },
        warning: {
            color: "orange",
            threshold: WARNING_THRESHOLD
        },
        alert: {
            color: "red",
            threshold: ALERT_THRESHOLD
        }
    };
    
    export let timeLimit;
    export let timePassed = 0;
    let timerInterval = null;
    
    let isInfo = true;
    let isWarning = false;
    let isAlert = false;
    let circleDasharray = '283';
    
    export function stop() {
        clearInterval(timerInterval);
    }

    onDestroy(() => {
        stop();
    })
    
    export function start() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timePassed = timePassed += 1;
            
            setCircleDasharray();
            setRemainingPathColor(timeLeft);
            
            if (timeLeft === 0) {
                stop();
            }
        }, 1000);
    }

    $: timeLeft = Math.floor(Math.max(0, timeLimit - timePassed));
    
    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;
        
        if (seconds < 10) {
            seconds = `0${seconds}`;
        }
        
        return `${minutes}:${seconds}`;
    }

    $: label = formatTime(timeLeft);

    function setRemainingPathColor(timeLeft) {
        const { alert, warning, info } = COLOR_CODES;
        isAlert = false;
        isWarning = false;
        isInfo = false;
        if (timeLeft <= alert.threshold) {
            isAlert = true;
        } else if (timeLeft <= warning.threshold) {
            isWarning = true;
        } else {
            isInfo = true;
        }
    }
    
    function calculateTimeFraction() {
        const rawTimeFraction = timeLeft / timeLimit;
        return rawTimeFraction - (1 / timeLimit) * (1 - rawTimeFraction);
    }
    
    function setCircleDasharray() {
        let fractional = (calculateTimeFraction() * FULL_DASH_ARRAY).toFixed(0)
        circleDasharray = `${fractional} 283`;
    }
</script>

<div class="base-timer">
    <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g class="base-timer__circle">
            <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
            <path
            id="base-timer-path-remaining"
            stroke-dasharray="{circleDasharray}"
            class="base-timer__path-remaining"
            class:isAlert
            class:isWarning
            class:isInfo
            d="
            M 50, 50
            m -45, 0
            a 45,45 0 1,0 90,0
            a 45,45 0 1,0 -90,0
            "
            ></path>
        </g>
    </svg>
    <span id="base-timer-label" class="base-timer__label">{label}</span>
</div>

<style>
    .base-timer {
        position: relative;
        width: 100%;
        height: 100%;
    }
    
    .base-timer__svg {
        transform: scaleX(-1);
    }
    
    .base-timer__circle {
        fill: none;
        stroke: none;
    }
    
    .base-timer__path-elapsed {
        stroke-width: 7px;
        stroke: rgb(229, 229, 229);
    }
    
    .base-timer__path-remaining {
        stroke-width: 7px;
        stroke-linecap: round;
        transform: rotate(90deg);
        transform-origin: center;
        transition: 1s linear all;
        fill-rule: nonzero;
        stroke: currentColor;
    }
    
    .isInfo {
        color: rgb(65, 184, 131);
    }
    
    .isWarning {
        color: orange;
    }
    
    .isAlert {
        color: red;
    }
    
    .base-timer__label {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
    }
</style>