export default [
    {
        "title": "KAFE",
        "description": `<p>A "KAFE" retrospective is a structured approach used in project management and team-building to reflect on the past and plan for the future. In this type of retrospective, participants focus on four specific areas:</p>
        <ul><li>Kvetches: What things have been frustrating but unavoidable during the project or process?</li>
        <li>Appreciations: What people or things do team members appreciate while working on the project or process?</li>
        <li>Flaws: What things occurred that could be improved with the project or process?</li>
        <li>Experiments: What different behaviors or activities do team members believe will improve the project or process?</li></ul>
        <p>The advantage of a "KAFE" retrospective is that it provides directed outlets for complaints, which typically bog down a productive retrospective, and an opportunity to end on a high note where teammates and environments are explicitly called out for their positive contributions.  This approach acknowledges that emotions play a role in team dynamics and decision-making, and forsters a process to productively surface those thoughts without overwhelming the benefit of the overall retrospective review.</p>
        <p>By focusing on the individual components of the retrospective as it progresses, this retrospective allows the team to constrain the time they spend on those components to effectively evaluate the potential for positive change. It helps to create a shared understanding of the team's experiences and how they can be addressed in the future.</p>
        <p>Overall, the "KAFE" retrospective is an effective tool for teams to reflect on their struggles and collective successes, and to identify ways to improve their performance and collaboration in the future.</p>`,
        "columns": [
            {seq: 1, title: "Kvetches", display: 'default'},
            {seq: 2, title: "Appreciations", display: 'default'},
            {seq: 3, title: "Flaws", display: 'default'},
            {seq: 4, title: "Experiments", display: 'default'},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove", "doHidden"], mode: "columns"},
            {seq: 2, title: "group", options: ["doMove", "doGroup", "doComment", "doShowComments"], mode: "columns"},
            {seq: 3, title: "kvetch", options: ["solo:$Kvetches", "doComment", "doShowComments"], mode: "present"},
            {seq: 4, title: "vote", options: ["hide:$Appreciations", "hide:$Kvetches", "doComment", "doVote", "doShowComments"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doShowVotes", "hide:$Kvetches", "hide:$Appreciations", "doShowComments"], mode: "present"},
            {seq: 6, title: "appreciate", options: ["solo:$Appreciations", "doShowComments"], mode: "present"},
            {seq: 7, title: "review", options: [], mode: "review"},
        ]
    },
    {
        "title": "Start, Stop, Continue",
        "description": `<p>A "Start, Stop, Continue" retrospective is a structured approach used in project management and team-building to reflect on the past and plan for the future. In this type of retrospective, participants focus on three specific areas:</p>
        <ul><li>Start: What activities or processes should the team start doing to improve their performance?</li>
        <li>Stop: What activities or processes should the team stop doing that are hindering their performance?</li>
        <li>Continue: What activities or processes should the team continue doing that are working well?</li></ul>
        <p>The advantage of a "Start, Stop, Continue" retrospective is that it provides a clear framework for team members to give feedback and reflect on their experiences. It encourages everyone to think critically about their actions, behaviors, and outcomes. This approach also promotes open communication, as everyone is given an opportunity to share their thoughts and ideas.</p>
        <p>By focusing on what the team should start, stop, and continue doing, this retrospective allows the team to identify concrete actions that can be taken to improve their performance. It helps to create a shared understanding of what works and what doesn't, which can be used to inform future decision-making and planning.</p>
        <p>Overall, the "Start, Stop, Continue" retrospective is an effective tool for teams to reflect on their work and continuously improve their performance.</p>`,
        "columns": [
            {seq: 1, title: "Start", display: 'default'},
            {seq: 2, title: "Stop", display: 'default'},
            {seq: 3, title: "Continue", display: 'default'},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove", "doHidden"], mode: "columns"},
            {seq: 2, title: "group", options: ["doMove", "doGroup", "doComment", "doShowComments"], mode: "columns"},
            {seq: 4, title: "vote", options: ["doVote", "doMove", "doComment", "doShowComments"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doShowVotes", "doShowComments"], mode: "present"},
            {seq: 7, title: "review", options: [], mode: "review"},
        ]
    },
    {
        "title": "Mad, Sad, Glad",
        "description": `<p>A "Mad, Sad, Glad" retrospective is a structured approach used in project management and team-building to reflect on the past and plan for the future. In this type of retrospective, participants focus on three specific areas:</p>
        <ul><li>Mad: What are the things that made team members upset or angry during the project or process?</li>
        <li>Sad: What are the things that made team members feel disappointed or sad during the project or process?</li>
        <li>Glad: What are the things that team members feel positive or happy about during the project or process?</li></ul>
        <p>The advantage of a "Mad, Sad, Glad" retrospective is that it provides a clear and organized way for team members to express their emotions and feelings about the project or process. This approach acknowledges that emotions play a role in team dynamics and decision-making, and creates a safe space for team members to share their thoughts and feelings.</p>
        <p>By focusing on what made team members mad, sad, and glad, this retrospective allows the team to identify the key issues that affected their work and their emotional states. It helps to create a shared understanding of the team's experiences and how they can be addressed in the future.</p>
        <p>This retrospective approach also promotes empathy and understanding among team members. By listening to each other's emotions and experiences, team members can gain a deeper appreciation for each other's perspectives and work together more effectively in the future.</p>
        <p>Overall, the "Mad, Sad, Glad" retrospective is an effective tool for teams to reflect on their emotions and experiences, and to identify ways to improve their performance and collaboration in the future.</p>`,
        "columns": [
            {seq: 1, title: "Mad", display: 'default'},
            {seq: 2, title: "Sad", display: 'default'},
            {seq: 3, title: "Glad", display: 'default'},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove", "doHidden"], mode: "columns"},
            {seq: 2, title: "group", options: ["doMove", "doGroup", "doComment", "doShowComments"], mode: "columns"},
            {seq: 4, title: "vote", options: ["doVote", "doMove", "doComment", "doShowComments"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doShowVotes", "doShowComments"], mode: "present"},
            {seq: 7, title: "review", options: [], mode: "review"},
        ]
    },
    {
        "title": "4Ls",
        "description": `<p>A "4Ls" retrospective is a structured approach used in project management and team-building to reflect on the past and plan for the future. In this type of retrospective, participants focus on four specific areas, each beginning with the letter L:</p>
        <ul><li>Liked: What did the team like about the project or process?</li>
        <li>Learned: What did the team learn during the project or process?</li>
        <li>Lacked: What was missing or lacked during the project or process?</li>
        <li>Longed for: What did the team long for or wish for during the project or process?</li></ul>
        <p>The advantage of a "4Ls" retrospective is that it provides a simple and clear framework for team members to share their perspectives and insights about the project or process. This approach allows team members to focus on both positive and negative aspects of their work and to identify areas for improvement.</p>
        <p>By focusing on what the team liked, learned, lacked, and longed for, this retrospective allows the team to identify the key strengths and weaknesses of their work. It helps to create a shared understanding of what worked well and what needs to be improved in the future.</p>
        <p>This retrospective approach also promotes a culture of continuous learning and improvement. By reflecting on what was learned and what was lacking, the team can identify opportunities for growth and development in future projects or processes.</p>
        <p>Overall, the "4Ls" retrospective is an effective tool for teams to reflect on their work, identify areas for improvement, and promote a culture of continuous learning and improvement.</p>`,
        "columns": [
            {seq: 1, title: "Liked", display: 'default'},
            {seq: 2, title: "Lacked", display: 'default'},
            {seq: 3, title: "Learned", display: 'default'},
            {seq: 4, title: "Longed For", display: 'default'},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doMove", "doHidden"], mode: "columns"},
            {seq: 2, title: "group", options: ["doMove", "doGroup", "doComment", "doShowComments"], mode: "columns"},
            {seq: 4, title: "vote", options: ["doVote", "doMove", "doComment", "doShowComments"], mode: "columns"},
            {seq: 5, title: "discuss", options: ["doShowVotes", "doShowComments"], mode: "present"},
            {seq: 7, title: "review", options: [], mode: "review"},
        ]
    },
    {
        "title": "Lean Coffee",
        "description": `<p>A "Lean Coffee" meeting is a structured and collaborative gathering designed to facilitate focused discussions and knowledge sharing among participants. It follows the principles of Lean thinking and encourages open participation, continuous improvement, and efficient use of time.</p>
        <p>The steps of a Teambeat "Lean Coffee" meeting include:</p>
        <ol><li>Agenda Creation: Prior to or at the start of the meeting, participants propose discussion topics by adding them to the Topics column of the Teambeat board.</li>
        <li>Topic Voting: Participants then have the opportunity to vote on the topics they find most interesting or relevant. The votes help prioritize the discussion topics for the meeting.</li>
        <li>Time Boxing: Once the topics have been prioritized, use the timer to ensure that discussions remain focused so that the overall meeting time is managed well.</li>
        <li>Action Items and Reflection: As discussions unfold, actionable items or key takeaways are noted down. At the end of the meeting, a brief reflection may take place, discussing any outcomes, insights gained, or follow-up actions required.</li>
        </ol>
        <p>The "Lean Coffee" format is designed to foster engagement, empower participants to drive the conversation, and maximize the value of time spent in meetings. It encourages active participation, shared ownership of topics, and continuous improvement through the exchange of ideas and experiences. The structure of "Lean Coffee" promotes efficiency, focus, and collaborative learning within a group setting.</p>`,
        "columns": [
            {seq: 1, title: "Ice Breaker", description: [
                "What is your favorite ice cream flavor?",
                "What fictional family would you most like to join?",
                "If you could try any food, what would it be?",
                "What movie do you wish you could watch again for the first time?",
                "What is your go-to karaoke anthem?",
                "You can only eat one food again for the rest of your life. What is it?",
                "Who is the most interesting Disney character?",
                "What movie have you seen most recently?",
                "What is the best super power?",
                "What simple food will you never eat?",
                "Which superpower would you give to your arch enemy?",
                "What is your favorite movie genre to watch?",
                "What do you usually eat for a quick lunch?"
            ], display: "narrow"},
            {seq: 2, title: "Topics", display: 'default'},
        ],
        scenes: [
            {seq: 1, title: "collect", options: ["doAdd", "doEdit", "doComment", "doShowComments"], mode: "columns"},
            {seq: 2, title: "vote", options: ["doVote", "doComment", "doShowComments", "hide:$Ice Breaker"], mode: "columns"},
            {seq: 3, title: "discuss", options: ["doShowVotes", "doShowComments", "hide:$Ice Breaker"], mode: "present"},
            {seq: 4, title: "review", options: ["hide:$Ice Breaker"], mode: "review"},
        ]
    },
]