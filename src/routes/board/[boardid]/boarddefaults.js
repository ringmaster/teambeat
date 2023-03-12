export default [
    {
        "title": "KAFE",
        "description": "Use this format to capture problems with a recent project or process, develop areas for improvement, and show appreciation for reammates.",
        "columns": [
            {seq: 1, title: "Kvetches"},
            {seq: 2, title: "Appreciations"},
            {seq: 3, title: "Flaws"},
            {seq: 4, title: "Experiments"},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove"], mode: "columns"},
            {seq: 2, title: "group", options: ["doReveal", "doMove"], mode: "columns"},
            {seq: 3, title: "kvetch", options: ["doReveal", "hide:$Appreciations", "hide:$Flaws", "hide:$Experiments"], mode: "present"},
            {seq: 4, title: "vote", options: ["doReveal", "doVote", "doMove"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doReveal", "doShowVotes"], mode: "present"},
            {seq: 6, title: "appreciate", options: ["doReveal", "hide:$Kvetches", "hide:$Flaws", "hide:$Experiments"], mode: "present"},
        ]
    },
    {
        "title": "Start, Stop, Continue",
        "description": "",
        "columns": [
            {seq: 1, title: "Start"},
            {seq: 2, title: "Stop"},
            {seq: 3, title: "Continue"},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove"], mode: "columns"},
            {seq: 2, title: "group", options: ["doReveal", "doMove"], mode: "columns"},
            {seq: 4, title: "vote", options: ["doReveal", "doVote", "doMove"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doReveal", "doShowVotes"], mode: "present"},
        ]
    },
    {
        "title": "Mad, Sad, Glad",
        "description": "",
        "columns": [
            {seq: 1, title: "Mad"},
            {seq: 2, title: "Sad"},
            {seq: 3, title: "Glad"},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove"], mode: "columns"},
            {seq: 2, title: "group", options: ["doReveal", "doMove"], mode: "columns"},
            {seq: 4, title: "vote", options: ["doReveal", "doVote", "doMove"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doReveal", "doShowVotes"], mode: "present"},
        ]
    },
    {
        "title": "4Ls",
        "description": "",
        "columns": [
            {seq: 1, title: "Liked"},
            {seq: 2, title: "Lacked"},
            {seq: 3, title: "Learned"},
            {seq: 4, title: "Longed For"},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove"], mode: "columns"},
            {seq: 2, title: "group", options: ["doReveal", "doMove"], mode: "columns"},
            {seq: 4, title: "vote", options: ["doReveal", "doVote", "doMove"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doReveal", "doShowVotes"], mode: "present"},
        ]
    },
]