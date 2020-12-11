module.exports = {
	extends: ['@gamesdonequick/eslint-config', '@gamesdonequick/eslint-config/typescript'],
	env: {
		browser: true,
	},
	rules: {
		"@typescript-eslint/no-unsafe-call": 0,
		"@typescript-eslint/no-unsafe-member-access": 0,
		"@typescript-eslint/prefer-readonly-parameter-types": 0
	}
};
