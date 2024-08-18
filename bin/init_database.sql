CREATE DATABASE TLP;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;
USE TLP;


CREATE TABLE studentinfo (
    rollno VARCHAR(15) NOT NULL,
    Name VARCHAR(255) DEFAULT NULL,
    sec VARCHAR(2) DEFAULT NULL,
    sem INT DEFAULT NULL,
    batch INT DEFAULT NULL,
    token VARCHAR(10) DEFAULT NULL,
    password VARCHAR(255) DEFAULT NULL,
    branch VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (rollno)
);


CREATE TABLE subjects (
    subCode VARCHAR(25) NOT NULL,
    subName VARCHAR(255) DEFAULT NULL,
    qtype VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (subCode)
);

CREATE TABLE theoryscore1 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    batch INT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem)
);


CREATE TABLE theoryscore2 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    batch INT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem)
);


CREATE TABLE timetable (
    facID VARCHAR(15) NOT NULL,
    subCode VARCHAR(25) NOT NULL,
    sem INT NOT NULL,
    sec VARCHAR(5) NOT NULL,
    branch VARCHAR(10) NOT NULL,
    PRIMARY KEY (facID, subCode, sem, sec, branch)
);


CREATE TABLE users (
    userName VARCHAR(255) NOT NULL,
    password VARCHAR(255) DEFAULT NULL,
    displayName VARCHAR(255) NOT NULL,
    desg VARCHAR(10) DEFAULT NULL,
    branch VARCHAR(10) NOT NULL,
    PRIMARY KEY (userName, displayName, branch)
);


CREATE TABLE cf1 (
    rollno VARCHAR(15) NOT NULL,
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    q0 INT DEFAULT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    q11 INT DEFAULT NULL,
    q12 INT DEFAULT NULL,
    q13 INT DEFAULT NULL,
    q14 INT DEFAULT NULL,
    q15 INT DEFAULT NULL,
    q16 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, branch, batch, sem)
);

CREATE TABLE cf2 (
    rollno VARCHAR(15) NOT NULL,
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    q0 INT DEFAULT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    q11 INT DEFAULT NULL,
    q12 INT DEFAULT NULL,
    q13 INT DEFAULT NULL,
    q14 INT DEFAULT NULL,
    q15 INT DEFAULT NULL,
    q16 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, branch, batch, sem)
);

CREATE TABLE cfreport1 (
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    percentile DECIMAL(10,4) DEFAULT NULL,
    PRIMARY KEY (branch, batch, sem)
);

CREATE TABLE cfreport2 (
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    percentile DECIMAL(10,4) DEFAULT NULL,
    PRIMARY KEY (branch, batch, sem)
);

CREATE TABLE countterm (
    count INT NOT NULL
);

CREATE TABLE faculty (
    facID VARCHAR(15) NOT NULL,
    facName VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (facID)
);

CREATE TABLE labscore1 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    batch INT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem)
);

CREATE TABLE labscore2 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    batch INT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem)
);


CREATE TABLE questions (
    qtype VARCHAR(10) NOT NULL,
    question VARCHAR(500) NOT NULL,
    seq INT NOT NULL,
    PRIMARY KEY (qtype, seq)
);

CREATE TABLE report1 (
    facID VARCHAR(15) NOT NULL,
    facName VARCHAR(100) DEFAULT NULL,
    subcode VARCHAR(50) NOT NULL,
    sec CHAR(1) NOT NULL,
    sem INT NOT NULL,
    percentile DECIMAL(10,4) DEFAULT NULL,
    batch INT NOT NULL,
    branch VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (facID, subcode, sec, sem, batch)
);

CREATE TABLE report2 (
    facID VARCHAR(15) NOT NULL,
    facName VARCHAR(100) DEFAULT NULL,
    subcode VARCHAR(50) NOT NULL,
    sec CHAR(1) NOT NULL,
    sem INT NOT NULL,
    percentile DECIMAL(10,4) DEFAULT NULL,
    batch INT NOT NULL,
    branch VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (facID, subcode, sec, sem, batch)
);


INSERT INTO users VALUES ("admin", "2d207f75d95007876a8a2971928102c1", "AD", "admin", '');


