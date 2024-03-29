const webscrape = require("webscrape");
const scrapper = webscrape.default();

const getTeam = async (teamQuery) => {
  let searchResult = await scrapper.get(
    "https://www.vlr.gg/search/?q=" + teamQuery
  );

  if (!searchResult.$(".search-item.mod-first").attr("href")) {
    return {
      success: "false",
      message: "Can't find team with this query. (CANNOT_FIND)",
    };
  } else {
    let profileURL =
      "https://www.vlr.gg" +
      searchResult.$(".search-item.mod-first").attr("href");

    if (!profileURL.includes("team"))
      return {
        success: "false",
        message: "Can't find team with this query. (NOT_TEAM)",
      };

    let teamProfile = await scrapper.get(profileURL);

    let teamRoster = {};

    // Get Roster Aliases
    teamProfile.$(".team-roster-item-name-alias").each((i, elm) => {
      teamRoster[i] = {
        nickname: elm.children[0].data.replace(/[\t\n]+/g, ""),
      };
      teamRoster[i].nickname = elm.children[2].data.replace(/[\t\n]+/g, "");
    });

    // // Get Roster Real Names
    teamProfile.$(".team-roster-item-name-real").each((i, elm) => {
      teamRoster[i].name = elm.children[0].data.replace(/[\t\n]+/g, "");
    });

    let upcomingURL =
      "https://vlr.gg/team/matches/" +
      profileURL.split("/")[4] +
      "?group=upcoming";
    let upcomingMatches = await scrapper.get(upcomingURL);

    let uMatches = {};

    // Get Upcoming Match's ID
    upcomingMatches.$("a.wf-module-item.mod-flex.rm-item").each((i, elm) => {
      uMatches[i] = {
        id: elm.attribs.href.split("/")[1],
      };
    });

    // Get Upcoming Match's URL
    upcomingMatches.$("a.wf-module-item.mod-flex.rm-item").each((i, elm) => {
      uMatches[i].url = "https://www.vlr.gg" + elm.attribs.href;
    });

    // Get Upcoming Match's Name
    upcomingMatches
      .$(":not(.mod-tbd) .rm-item-event")
      .children('.text-of[style="font-weight: 500; margin-bottom: 4px;"]')
      .each((i, elm) => {
        uMatches[i].name = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Upcoming Match's Event Name
    upcomingMatches
      .$(":not(.mod-tbd) .rm-item-event")
      .children(".rm-item-event-series")
      .each((i, elm) => {
        uMatches[i].event = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Upcoming Match's Opponent
    upcomingMatches
      .$(":not(.mod-tbd) .rm-item-opponent")
      .children(".text-of")
      .each((i, elm) => {
        uMatches[i].opponent = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Upcoming Match's Date
    upcomingMatches.$(":not(.mod-tbd) .rm-item-date").each((i, elm) => {
      uMatches[i].date =
        `${elm.children[0].next.next.data.replace(/[\t\n]+/g, "")} ` +
        `${elm.children[0].data.replace(/[\t\n]+/g, "")}`;
    });

    let completedURL =
      "https://vlr.gg/team/matches/" +
      profileURL.split("/")[4] +
      "?group=completed";
    let completedMatches = await scrapper.get(completedURL);
    let teamName = teamProfile.$(".team-header-name h1").text();

    let cMatches = {};

    // Get Completed Match's ID
    completedMatches.$("a.wf-module-item.mod-flex.rm-item").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i] = {
        id: elm.attribs.href.split("/")[1],
      };
    });

    // Get Completed Match's URL
    completedMatches.$("a.wf-module-item.mod-flex.rm-item").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i].url = "https://www.vlr.gg" + elm.attribs.href;
    });

    // Get Completed Match's Name
    completedMatches
      .$(":not(.mod-tbd) .rm-item-event")
      .children('.text-of[style="font-weight: 500; margin-bottom: 4px;"]')
      .each((i, elm) => {
        if (i > 4) return false;
        cMatches[i].name = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Completed Match's Event Name
    completedMatches
      .$(":not(.mod-tbd) .rm-item-event")
      .children(".rm-item-event-series")
      .each((i, elm) => {
        if (i > 4) return false;
        cMatches[i].event = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Completed Match's Opponent
    completedMatches
      .$(":not(.mod-tbd) .rm-item-opponent")
      .children(".text-of")
      .each((i, elm) => {
        if (i > 4) return false;
        cMatches[i].opponent = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Completed Match's Date
    completedMatches.$(":not(.mod-tbd) .rm-item-date").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i].date =
        `${elm.children[0].next.next.data.replace(/[\t\n]+/g, "")} ` +
        `${elm.children[0].data.replace(/[\t\n]+/g, "")}`;
    });

    // Get Score of Queried Team in Completed Match
    completedMatches.$(":not(.mod-tbd) .rf").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i].score = {};
      cMatches[i].score[teamName] = elm.children[0].data;
    });

    // Get Score of Opponent Team in Completed Match
    completedMatches.$(":not(.mod-tbd) .ra").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i].score[`${cMatches[i].opponent}`] = elm.children[0].data;
    });

    let result = {
      success: true,
      teamInfo: {
        name: teamProfile.$(".team-header-name h1").text(),
        prefix: teamProfile.$(".team-header-name h2").text(),
        logo: teamProfile.$(".team-header-logo div img").attr("src"),
        url: profileURL,
        id: profileURL.split("/")[4],
        roster: teamRoster,
        rating: {
          region: teamProfile
            .$(".rating-txt.ge-text")
            .text()
            .replace(/[\t\n]+/g, ""),
          currentRank: teamProfile
            .$("div.rank-num")
            .text()
            .replace(/[\t\n]+/g, ""),
          currentPoints: teamProfile
            .$(".team-rating-info-section.mod-rating .rating-num")
            .text()
            .split("\n")[1]
            .replace(/[\t\n]+/g, ""),
          maxPoints: teamProfile
            .$(".team-rating-info-section.mod-rating .rating-num")
            .text()
            .split("\n")[2]
            .replace(/[\t\n]+/g, ""),
          currentStreak: teamProfile
            .$(".team-rating-info-section.mod-streak .rating-num")
            .text()
            .split(" ")[0]
            .replace(/[\t\n]+/g, ""),
          bestStreak: teamProfile
            .$(".team-rating-info-section.mod-streak .rating-num")
            .text()
            .split(" ")[1]
            .replace(/[\t\n]+/g, ""),
        },
        stats: {
          totalWinnings: teamProfile
            .$('span[style="font-size: 22px; font-weight: 500;"]')
            .text()
            .replace(/[\t\n]+/g, ""),
          upcomingMatches: uMatches,
          completedMatches: cMatches,
        },
      },
    };
    return result;
  }
};

module.exports = getTeam;
