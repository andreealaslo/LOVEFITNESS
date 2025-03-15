module.exports = (srv => {

    const {
        USERS, MUSCLE_GROUPS, MEDICAL_AFFECTIONS, EXERCISES, USER_EXERCISES
    } = srv.entities;

    srv.on('getUUID', async (req) => {
        try {
            const result = await cds.run(`SELECT TO_NVARCHAR(SYSUUID) as UUID FROM DUMMY`);
            return result[0].UUID
        } catch (err) {
            return "Error";
        }
    });

    srv.on("test", async (req) => {
        const tx = cds.transaction(req);
        let qUsers = SELECT.from(USERS);
        const aUsers = await tx.run(
            qUsers
        ).catch(function (error) {
            console.warn(error);
            return null;
        });
        return (JSON.stringify(aUsers));
    });

    srv.on("showMedicalAffectionsForMuscles", async (req) => {
        let sMuscleAffectedParam = req.data.muscleAffected;
        let sResult = "";

        const tx = cds.transaction(req);
        let qMuscleAffected = SELECT.from(MUSCLE_GROUPS).where('NAME =', sMuscleAffectedParam);
        const aMuscleAffected = await tx.run(
            qMuscleAffected
        ).catch(function (error) {
            console.warn(error);
            return null;
        });

        if (aMuscleAffected.length != 0) {
            let sIDmuscleAffected = aMuscleAffected[0].ID;

            let qMedicalAffectionsForMuscle = SELECT.from(MEDICAL_AFFECTIONS).where('MUSCLE_AFFECTED_ID =', sIDmuscleAffected);
            const aMedicalAffectionsForMuscle = await tx.run(
                qMedicalAffectionsForMuscle
            ).catch(function (error) {
                console.warn(error);
                return null;
            });

            if (aMedicalAffectionsForMuscle.length === 1)
                sResult = "Medical affection of muscle " + sMuscleAffectedParam + " is: " + aMedicalAffectionsForMuscle[0].DESCRIPTION + ".";
            else if (aMedicalAffectionsForMuscle.length > 1)
                sResult = "Medical affection of muscle " + sMuscleAffectedParam + " are: " + aMedicalAffectionsForMuscle.map(item => item.DESCRIPTION).join("|");
            else
                sResult = "There is no medical affection for muscle " + sMuscleAffectedParam + ".";
        }
        else sResult = "More about this muscle later....:)";

        return (sResult);
    });

    srv.on("rankForExercise", async (req) => {
        const tx = cds.transaction(req);
        let qExercise = SELECT.from(EXERCISES).where("NAME =", req.data.exercise);
        const aExercise = await tx.run(
            qExercise
        ).catch(function (error) {
            console.warn(error);
            return null;
        });

        let sExerciseID = aExercise[0].ID;

        let qSetsForExercise = SELECT.from(USER_EXERCISES).where("EXERCISE_ID =", sExerciseID);
        const aSetsForExercise = await tx.run(
            qSetsForExercise
        ).catch(function (error) {
            console.warn(error);
            return null;
        });

        var dScores = {};   //oScores
        aSetsForExercise.forEach((oExercise) => {
            let sKey = oExercise.USER_EMAIL
            let sScorePerSet = 0.7 * oExercise.WEIGHT + 0.3 * oExercise.NUMBER_OF_REPS;
            if (!dScores[sKey]) {
                dScores[sKey] = sScorePerSet;
            } else {
                dScores[sKey] += sScorePerSet;
            }
        });   //schimba cu for simplu 

        var aDescendingScores = Object.keys(dScores)
            .sort((a, b) => dScores[b] - dScores[a])
            .reduce((aAcc, sKey, iIndex, aArray) => {
                if (iIndex === 0 || dScores[sKey] !== dScores[aArray[iIndex - 1]]) {
                    aAcc.push([sKey]);
                } else {
                    aAcc[aAcc.length - 1].push(sKey);
                }
                return aAcc;
            }, []);

        let iPositionOfUser = -1;
        for (let i = 0; i < aDescendingScores.length; i++) {
            if (aDescendingScores[i].includes(req.data.userEmail)) {
                iPositionOfUser = i;
                break;
            }
        }

        let iNumberOfUsersWithSameRank = aDescendingScores[iPositionOfUser].length;
        let sMessageNumberOfUsers = "";
        if (iNumberOfUsersWithSameRank == 1)
            sMessageNumberOfUsers = " You are the only user with this rank! ";
        else {
            iNumberOfUsersWithSameRank -= 1;
            if (iNumberOfUsersWithSameRank == 1)
                sMessageNumberOfUsers = iNumberOfUsersWithSameRank + " user has the same rank as you! ";
            else
                sMessageNumberOfUsers = iNumberOfUsersWithSameRank + " users have the same rank as you! ";
        }

        let iNumberUsers = Object.keys(dScores).length;
        let iCalculateRank = (iPositionOfUser, iNumberUsers) => {
            if (iNumberUsers > 1) {
                return 1 + (iPositionOfUser / (iNumberUsers - 1)) * 99;
            }
            else return 1 + (iPositionOfUser / (iNumberUsers)) * 99;
        };

        iUserRank = iCalculateRank(iPositionOfUser, iNumberUsers);
        if (iUserRank == 1)
            return ("You have the highest rank for " + req.data.exercise + ", which is 1. " + sMessageNumberOfUsers + "Congratulations!!!!");
        return ("Your rank is " + Math.ceil(iUserRank) + " . " + sMessageNumberOfUsers + " Keep going till you reach rank 1.");
    });

    srv.on("generateBadge", async (req) => {

        let dBadgeMessages = {
            0: "We thought that we lost you! :D",   //daca a trecut mai mult de 7 zile de la ultima logare
            1: "Don't be shy, you can do this! :)",   //daca au trecut intre 3-7 zile de la ultima logare
            2: "It seems like you cannot stay away from us too long! :)",   //daca au trecut 1-2 zile de la ultima logare
            3: "It was about time! :) Welcome!"    //prima logare
        }

        const tx = cds.transaction(req);
        let qUser = SELECT.from(USERS).where("EMAIL =", req.data.userEmail)
        const aUser = await tx.run(
            qUser
        ).catch(function (error) {
            console.warn(error);
            return null;
        });

        let dDateToday = new Date();

        if (aUser[0].LAST_LOGGED_ON === null)
            return (dBadgeMessages[3]);

        let iNumberOfDaysPassed = aUser[0].LAST_LOGGED_ON ? Math.floor((new Date(dDateToday) - new Date(aUser[0].LAST_LOGGED_ON)) / (24 * 60 * 60 * 1000)) : null;

        if (iNumberOfDaysPassed !== null) {
            if (iNumberOfDaysPassed > 7)
                return (dBadgeMessages[0]);
            else if (iNumberOfDaysPassed <= 7 && iNumberOfDaysPassed >= 3)
                return (dBadgeMessages[1]);
            else if (iNumberOfDaysPassed <= 2)
                return (dBadgeMessages[2]);
        }
    });



    srv.on("increaseLevel", async (req) => {
        //aici vreau sa incep sa definesc ce actiuni ale userului ii vor creste nivelul


        //daca userul ajunge sa aiba rank ul 1 la un exercitiu - pot sa formez mai multe idei legandu ma de rank
        //daca isi pastreaza badge ul cel mai bun un anumit timp - la fel pot sa formez idei legandu ma de badge

    });
})