package models

// Structures used by LeetCode leaderboard features

type Submission struct {
	Title         string `json:"title"`
	TitleSlug     string `json:"titleSlug"`
	Timestamp     string `json:"timestamp"`
	StatusDisplay string `json:"statusDisplay"`
	Lang          string `json:"lang"`
	ID            string `json:"id"`
}

type Problems struct {
	Count      int          `json:"count"`
	Submission []Submission `json:"submission"`
}

type LeaderboardAPIResponse struct {
	DiscordUsername  string      `json:"discord_username"`
	LeetCodeUsername string      `json:"leetcode_username"`
	Wins             int         `json:"wins"`
	LocalRanking     interface{} `json:"local_ranking"` // Can be string or int
	Ranking          int         `json:"ranking"`
	Avatar           string      `json:"avatar"`
	Points           float64     `json:"points"`
	Problems         Problems    `json:"problems"`
}

type LeaderboardCard struct {
	Available        bool     `json:"available"`
	Message          string   `json:"message,omitempty"`
	DiscordUsername  string   `json:"discord_username,omitempty"`
	LeetCodeUsername string   `json:"leetcode_username,omitempty"`
	Points           float64  `json:"points,omitempty"`
	Wins             int      `json:"wins,omitempty"`
	LocalRanking     int      `json:"local_ranking,omitempty"`
	Avatar           string   `json:"avatar,omitempty"`
	Problems         Problems `json:"problems,omitempty"`
}

type Top10Row struct {
	DiscordUsername string  `json:"discord_username"`
	Username        string  `json:"username"`
	Points          float64 `json:"points"`
}

type AllTimeRow struct {
	DiscordUsername  string `json:"discord_username"`
	LeetCodeUsername string `json:"leetcode_username"`
	TotalWins        int    `json:"total_wins"`
	TotalPoints      int    `json:"total_points"`
}
