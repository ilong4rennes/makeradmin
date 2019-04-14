import * as common from "./common"
import * as login from "./login"
import {logout, UNAUTHORIZED} from "./common";
declare var UIkit: any;


common.documentLoaded().then(() => {
    common.addSidebarListeners();

    const apiBasePath = window.apiBasePath;

    function renderInfo(info: any, templateStrings: any) {
        let text = "";
        let icon = "";
        let color = "";

        const millisecondsPerHour = 1000 * 3600;
        const millisecondsPerDay = millisecondsPerHour * 24;

        const end = Date.parse(info.enddate) + millisecondsPerDay;

        if (info.active) {
            const remainingDays = Math.floor((end - Date.now()) / millisecondsPerDay);

            if (remainingDays < -1) {
                text = templateStrings[0](info.enddate, -remainingDays);
                icon = "close";
                color = "member-key-color-inactive";
            } else if (remainingDays < 0) {
                text = templateStrings[1]();
                icon = "close";
                color = "member-key-color-inactive";
            } else if (remainingDays < 1) {
                const remainingHours = Math.ceil((end - Date.now()) / millisecondsPerHour);
                text = templateStrings[2](remainingHours);
                icon = "check";
                color = "member-key-color-warning";
            } else if (remainingDays < 14) {
                text = templateStrings[3](info.enddate, remainingDays);
                icon = "check";
                color = "member-key-color-warning";
            } else {
                text = templateStrings[4](info.enddate, remainingDays);
                icon = "check";
                color = "member-key-color-active";
            }
        } else {
            text = templateStrings[5]();
            icon = "close";
            color = "member-key-color-inactive";
        }

        return `<div class="member-key-box">
                    <div class="uk-icon-small member-key-icon ${color}" uk-icon="${icon}">
                    </div>
                    <div class="member-key-status">
                        ${text}
                    </div>
                </div>`;
    }

    function render_key_view(membership: any, pending_actions_json: any) {
        const info_membership = {
            active:  membership.has_membership,
            enddate: membership.membership_end,
        };
        const info_labaccess_membership = {
            active:  membership.has_labaccess_membership,
            enddate: membership.labaccess_membership_end,
        };
        const info_special_membership = {
            active:  membership.has_special_membership,
            enddate: membership.special_membership_end,
        };

        let pendingLabaccessDays = 0;
        for (let pending of pending_actions_json.data) {
            if (pending.action.action === "add_labaccess_days") {
                pendingLabaccessDays += pending.action.value;
            }
        }

        const labaccessMembershipStrings = [
            (enddate: string, days: number) => `Din <strong>labaccess</strong> är ogiltig sedan ${days} dagar (${enddate}). <br>Your <strong>lab membership</strong> expired ${days} day(s) ago (${enddate}).`,
            () => `Din <strong>labaccess</strong> gick ut igår. <br>Your <strong>lab membership</strong> expired yesterday.`,
            (hours: number) => `Din <strong>labaccess</strong> är giltig i mindre än ${hours} timmar till. <br>Your <strong>lab membership</strong> is valid for ${hours} more hours.`,
            (enddate: string, days: number) => `Din <strong>labaccess</strong> är giltig t.o.m. ${enddate} (endast ${days} dagar till). Kom ihåg att förnya den innan nästa nyckelutlämning. <br>Your <strong>lab membership</strong> is valid through ${enddate} (only ${days} day(s) left). Remember to extend your lab membership before the next nyckelutlämning.`,
            (enddate: string, days: number) => `Din <strong>labaccess</strong> är giltig t.o.m. ${enddate} (${days} dagar till). <br>Your <strong>lab membership</strong> is valid through ${enddate} (only ${days} day(s) left).`,
            () => `Din <strong>labaccess</strong> är inaktiv. <br>Your <strong>lab membership</strong> is inactive.`,
        ];

        const membershipStrings = [
            (enddate: string, days: number) => `Ditt <strong>föreningsmedlemsskap</strong> är ogiltigt sedan ${days} dagar (${enddate}). <br>Your <strong>membership</strong> expired ${days} day(s) ago (${enddate})`,
            () => `Ditt <strong>föreningsmedlemsskap</strong> gick ut igår. <br>Your <strong>membership</strong> expired yesterday.`,
            (hours: number) => `Ditt <strong>föreningsmedlemsskap</strong> går ut idag. <br>Your <strong>membership</strong> expires today.`,
            (enddate: string, days: number) => `Ditt <strong>föreningsmedlemsskap</strong> är giltigt t.o.m. ${enddate} (endast ${days} dagar till). <br>Your <strong>membership</strong> is valid through ${enddate} (only ${days} day(s) left).`,
            (enddate: string, days: number) => `Ditt <strong>föreningsmedlemsskap</strong> är giltigt t.o.m. ${enddate} (${days} dagar till). <br>Your <strong>membership</strong> is valid through ${enddate} (only ${days} day(s) left).`,
            () => `Ditt <strong>föreningsmedlemsskap</strong> är inaktivt. <br>Your <strong>membership</strong> is inactive.`,
        ];

        const specialAccessStrings = [
            (enddate: string, days: number) => ``,
            () => ``,
            (hours: number) => ``,
            (hours: number) => `Ditt <strong>föreningsmedlemsskap</strong> går ut idag. <br>Your <strong>membership</strong> expires today.`,
            (enddate: string, days: number) => `Du har fått <strong>specialtillträde</strong> till föreningslokalerna t.o.m. ${enddate} (${days} dag(ar) till). <br>You have been given <strong>special access</strong> to the premises through ${enddate} (${days} day(s) left).`,
            (enddate: string, days: number) => ``,
            () => ``,
        ];

        let calendarURL = "https://www.makerspace.se/kalendarium";
        let pendingAccess = "";
        if (pendingLabaccessDays > 0) {
            pendingAccess = `<p>Du har ${pendingLabaccessDays} dagar som kommer att läggas till på din labaccess vid nästa <a href=${calendarURL}>nyckelutlämning</a>. <br>You have ${pendingLabaccessDays} days that will be added to your lab membership during the next <a href=${calendarURL}>nyckelutlämning</a>.</p>`;
        } else {
            pendingAccess = `<p>Om du köper ny labaccess i webshoppen så kommer den aktiveras vid nästa <a href=${calendarURL}>nyckelutlämning</a>. <br>If you buy new lab membership time in the webshop it will activate during the next <a href=${calendarURL}>nyckelutlämning</a></p>`;
        }

        return `
            <fieldset class="data-uk-margin">
                <legend><i uk-icon="lock"></i> Medlemsskap</legend>
                ${renderInfo(info_membership, membershipStrings)}
                ${renderInfo(info_labaccess_membership, labaccessMembershipStrings)}
                ${info_special_membership.active?renderInfo(info_special_membership, specialAccessStrings):``}
                ${pendingAccess}
            </fieldset>`;
    }

    const root = <HTMLElement>document.querySelector("#content");

    const future1 = common.ajax("GET", apiBasePath + "/member/current", null);
    const future2 = common.ajax("GET", apiBasePath + "/member/current/membership", null);
    const future3 = common.ajax("GET", apiBasePath + "/webshop/member/current/pending_actions", null);

    Promise.all([future1, future2, future3]).then(([member_json, membership_json, pending_actions_json]) => {
        const member = member_json.data;
        const membership = membership_json.data;
        root.innerHTML = `
            <form class="uk-form uk-form-stacked uk-margin-bottom">
                <h2>Medlem ${member.member_number}: ${member.firstname} ${member.lastname}</h2>
                <fieldset>
                    <legend><i uk-icon="user"></i> Personuppgifter</legend>
                    <div>
                        <label  for='firstname'       class="uk-form-label">Förnamn</label>
                        <input name='firstname'       class="uk-input readonly-input" value="${member.firstname || ''}" disabled />
                    </div>
                    <div>
                        <label  for='lastname'        class="uk-form-label">Efternamn</label>
                        <input name='lastname'        class="uk-input readonly-input" value="${member.lastname || ''}" disabled />
                    </div>
                    <div>
                        <label  for='email'           class="uk-form-label">E-post</label>
                        <input name='email'           class="uk-input readonly-input" value="${member.email || ''}" disabled />
                    </div>
                    <div>
                        <label  for='phone'           class="uk-form-label">Telefonnummer</label>
                        <input name='phone'           class="uk-input readonly-input" value="${member.phone || ''}" disabled />
                    </div>
                </fieldset>
                <fieldset data-uk-margin>
                    <legend><i uk-icon="home"></i> Adress</legend>
                    <div>
                        <label  for='address_street'  class="uk-form-label">Address</label>
                        <input name='address_street'  class="uk-input readonly-input" value="${member.address_street || ''}" disabled />
                    </div>
                    <div>
                        <label  for='address_extra'   class="uk-form-label">Extra adressrad, t ex C/O</label>
                        <input name='address_extra'   class="uk-input readonly-input" value="${member.address_extra || ''}" disabled />
                    </div>
                    <div>
                        <label  for='address_zipcode' class="uk-form-label">Postnummer</label>
                        <input name='address_zipcode' class="uk-input readonly-input" value="${member.address_zipcode || ''}" disabled />
                    </div>
                    <div>
                        <label  for='address_city'    class="uk-form-label">Postort</label>
                        <input name='address_city'    class="uk-input readonly-input" value="${member.address_city || ''}" disabled />
                    </div>
                </fieldset>

                ${render_key_view(membership, pending_actions_json)}
            </form>`;
    }).catch(e => {
        // Probably Unauthorized, redirect to login page.
        if (e.status === UNAUTHORIZED) {
            // Render login
            login.render_login(root, null, null);
        } else {
            UIkit.modal.alert("<h2>Failed to load member info</h2>");
        }
    });
});
