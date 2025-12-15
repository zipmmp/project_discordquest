import QuestConfig from "../lib/questConfig.js";
import ms from "ms";

export default new QuestConfig({
    name: "PLAY_ON_DESKTOP",
    
    async run(user) {
        const secondsNeeded = user.target;
        let progress = user.current || 0;
        
        while (!user.stoped) {
            try {
                const heartbeat = await user.api.post(`/quests/${user.quest}/heartbeat`, {
                    stream_key: `call:${user.quest}:1`,
                    terminal: false
                });
                
                if (!heartbeat?.data?.user_id) {
                    user.stop("Error sending heartbeat");
                    break;
                }
                
                const response = user.extractProgress(heartbeat.data);
                progress = response.value;
                user.sendUpdate(progress, response.completed);
                
                if (progress >= secondsNeeded || response.completed) {
                    user.stop();
                    user.completed = true;
                    break;
                }
                
                await user.delay(ms("30s"));
            } catch (error) {
                console.error("Error in PLAY_ON_DESKTOP quest:", error);
                user.stop("Heartbeat request failed");
                break;
            }
        }
    }
});
