// Abuse categories, as published at https://www.abuseipdb.com/categories.
//
// A frozen object plus a union derived from it, rather than a TypeScript
// `enum`: the values stay plain numbers on the wire, `ReportCategory.Ssh`
// reads better than `22` at a call site, and a caller who already has a
// number from somewhere else can still pass it.

export const ReportCategory = {
	/** Altering DNS records resulting in improper redirection. */
	DnsCompromise: 1,
	/** Falsifying domain server cache (cache poisoning). */
	DnsPoisoning: 2,
	/** Fraudulent orders. */
	FraudOrders: 3,
	/** Participating in distributed denial-of-service (usually part of a botnet). */
	DdosAttack: 4,
	FtpBruteForce: 5,
	/** Oversized IP packet. */
	PingOfDeath: 6,
	/** Phishing websites and/or email. */
	Phishing: 7,
	FraudVoip: 8,
	/** Open proxy, open relay, or Tor exit node. */
	OpenProxy: 9,
	/** Comment/forum spam, HTTP referer spam, or other CMS spam. */
	WebSpam: 10,
	/** Spam email content, infected attachments, and phishing emails. */
	EmailSpam: 11,
	/** CMS blog comment spam. */
	BlogSpam: 12,
	/** Conjunctive category. */
	VpnIp: 13,
	/** Scanning for open ports and vulnerable services. */
	PortScan: 14,
	Hacking: 15,
	/** Attempts at SQL injection. */
	SqlInjection: 16,
	/** Email sender spoofing. */
	Spoofing: 17,
	/** Credential brute-force attacks on logins and services like SSH, FTP, SIP, SMTP or RDP. */
	BruteForce: 18,
	/** Scraping and crawlers that do not honour robots.txt. */
	BadWebBot: 19,
	/** Host likely infected with malware and leveraged for further attacks. */
	ExploitedHost: 20,
	/** Attempts to probe for or exploit installed web applications. */
	WebAppAttack: 21,
	/** Secure Shell (SSH) abuse. */
	Ssh: 22,
	/** Abuse targeted at an "Internet of Things" device. */
	IotTargeted: 23,
} as const;

/**
 * One category id. Every documented category is a member; the type is written
 * as a union so `ReportCategory.Ssh` and a bare `22` are the same value.
 */
export type ReportCategory = (typeof ReportCategory)[keyof typeof ReportCategory];

/** Human-readable title for each category, in the wording AbuseIPDB uses. */
export const reportCategoryTitles: Readonly<Record<ReportCategory, string>> = {
	1: "DNS Compromise",
	2: "DNS Poisoning",
	3: "Fraud Orders",
	4: "DDoS Attack",
	5: "FTP Brute-Force",
	6: "Ping of Death",
	7: "Phishing",
	8: "Fraud VoIP",
	9: "Open Proxy",
	10: "Web Spam",
	11: "Email Spam",
	12: "Blog Spam",
	13: "VPN IP",
	14: "Port Scan",
	15: "Hacking",
	16: "SQL Injection",
	17: "Spoofing",
	18: "Brute-Force",
	19: "Bad Web Bot",
	20: "Exploited Host",
	21: "Web App Attack",
	22: "SSH",
	23: "IoT Targeted",
};
