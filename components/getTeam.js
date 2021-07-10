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

    // // Get Roster Real Names
    // teamProfile.$(".team-roster-item-name-real").each((i, elm) => {
    //   teamRoster[i] = {
    //     name: elm.children[0].data.replace(/[\t\n]+/g, ""),
    //   };
    // });

    // // Get Roster Aliases
    // teamProfile.$(".team-roster-item-name-alias").each((i, elm) => {
    //   teamRoster[i].alias = elm.children[2].data.replace(/[\t\n]+/g, "");
    // });

    // for (i = 0; i < array.length; i++) {

    // }

    let completedURL =
      "https://vlr.gg/team/matches/" +
      profileURL.split("/")[4] +
      "?group=completed";
    let completedMatches = await scrapper.get(completedURL);

    let cMatches = {};

    // Get Match Name
    completedMatches
      .$(":not(.mod-tbd) .rm-item-event")
      .children('.text-of[style="font-weight: 500; margin-bottom: 4px;"]')
      .each((i, elm) => {
        if (i > 4) return false;
        cMatches[i] = {
          name: elm.children[0].data.replace(/[\t\n]+/g, ""),
        };
      });

    // Get Event Name
    completedMatches
      .$(":not(.mod-tbd) .rm-item-event")
      .children(".rm-item-event-series")
      .each((i, elm) => {
        if (i > 4) return false;
        cMatches[i].event = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Match Opponent
    completedMatches
      .$(":not(.mod-tbd) .rm-item-opponent")
      .children(".text-of")
      .each((i, elm) => {
        if (i > 4) return false;
        cMatches[i].opponent = elm.children[0].data.replace(/[\t\n]+/g, "");
      });

    // Get Match Date
    completedMatches.$(":not(.mod-tbd) .rm-item-date").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i].date =
        `${elm.children[0].next.next.data.replace(/[\t\n]+/g, "")} ` +
        `${elm.children[0].data.replace(/[\t\n]+/g, "")}`;
    });

    // Get Score of Queried Team
    completedMatches.$(":not(.mod-tbd) .rf").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i].score = { self: elm.children[0].data };
    });

    // Get Score of Opponent Team
    completedMatches.$(":not(.mod-tbd) .ra").each((i, elm) => {
      if (i > 4) return false;
      cMatches[i].score.opponent = elm.children[0].data;
    });

    let result = {
      success: true,
      teamInfo: {
        name: teamProfile.$(".team-header-name h1").text(),
        prefix: teamProfile.$(".team-header-name h2").text(),
        logo: teamProfile.$(".team-header-logo div img").attr("src"),
        url: profileURL,
        id: profileURL.split("/")[4],
      },
      roster: teamRoster,
      stats: {
        totalWinnings: teamProfile
          .$('span[style="font-size: 22px; font-weight: 500;"]')
          .text()
          .replace(/[\t\n]+/g, ""),
        upcomingMatches: {},
        completedMatches: cMatches,
      },
    };
    return result;
  }
};

module.exports = getTeam;
