import { expect } from 'chai';

import { Dialect, identify } from '../../src';

/* eslint prefer-arrow-callback: 0 */
describe('identifier', function () {
  describe('given queries with a single statement', function () {
    it('should identify "SELECT" statement', function () {
      const actual = identify('SELECT * FROM Persons');
      const expected = [
        {
          start: 0,
          end: 20,
          text: 'SELECT * FROM Persons',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "SELECT" statement with quoted string', function () {
      const actual = identify("SELECT 'This is a ''quoted string' FROM Persons");
      const expected = [
        {
          start: 0,
          end: 46,
          text: "SELECT 'This is a ''quoted string' FROM Persons",
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "SELECT" statement with quoted table', function () {
      const actual = identify('SELECT * FROM "Pers;\'ons"');
      const expected = [
        {
          start: 0,
          end: 24,
          text: 'SELECT * FROM "Pers;\'ons"',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "SELECT" statement with quoted table in mssql', function () {
      const actual = identify('SELECT * FROM [Pers;\'ons]', { dialect: "mssql"});
      const expected = [
        {
          start: 0,
          end: 24,
          text: 'SELECT * FROM [Pers;\'ons]',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "CREATE TABLE" statement', function () {
      const actual = identify('CREATE TABLE Persons (PersonID int, Name varchar(255));');
      const expected = [
        {
          start: 0,
          end: 54,
          text: 'CREATE TABLE Persons (PersonID int, Name varchar(255));',
          type: 'CREATE_TABLE',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    describe('identify "CREATE VIEW" statements', () => {
      it('should identify "CREATE VIEW" statement', () => {
        const actual = identify("CREATE VIEW vista AS SELECT 'Hello World';");
        const expected = [
          {
            start: 0,
            end: 41,
            text: "CREATE VIEW vista AS SELECT 'Hello World';",
            type: 'CREATE_VIEW',
            executionType: 'MODIFICATION',
          },
        ];

        expect(actual).to.eql(expected);
      });

      describe('identifying "CREATE MATERIALIZED VIEW" statement', () => {
        const query = "CREATE MATERIALIZED VIEW vista AS SELECT 'Hello World';";
        (['psql', 'mssql'] as Dialect[]).forEach((dialect) => {
          it(`should identify for ${dialect}`, () => {
            const actual = identify(query, { dialect });
            const expected = [
              {
                start: 0,
                end: 54,
                text: query,
                type: 'CREATE_VIEW',
                executionType: 'MODIFICATION',
              },
            ];

            expect(actual).to.eql(expected);
          });
        });

        (['generic', 'mysql', 'sqlite'] as Dialect[]).forEach((dialect) => {
          it(`should throw error for ${dialect}`, () => {
            expect(() => identify(query, { dialect })).to.throw(
              /^Expected any of these tokens .* instead of type="keyword" value="MATERIALIZED" \(currentStep=1\)/
            );
          });
        });
      });

      describe('identify "CREATE OR REPLACE VIEW" statement', () => {
        const query = "CREATE OR REPLACE VIEW vista AS SELECT 'Hello world';";
        (['mysql', 'psql'] as Dialect[]).forEach((dialect) => {
          it(`should identify for ${dialect}`, () => {
            const actual = identify(query, { dialect });
            const expected = [
              {
                start: 0,
                end: 52,
                text: query,
                type: 'CREATE_VIEW',
                executionType: 'MODIFICATION',
              },
            ];

            expect(actual).to.eql(expected);
          });
        });

        (['generic', 'sqlite', 'mssql'] as Dialect[]).forEach((dialect) => {
          it(`should throw error for ${dialect}`, () => {
            expect(() => identify(query, { dialect })).to.throw(
              /^Expected any of these tokens .* instead of type="unknown" value="OR" \(currentStep=1\)/
            )
          });
        });
      });

      ['TEMP', 'TEMPORARY'].forEach((temp) => {
        describe(`identify "CREATE ${temp} VIEW" statement`, () => {
          const query = `CREATE ${temp} VIEW vista AS SELECT 'Hello world';`;
          (['sqlite', 'psql'] as Dialect[]).forEach((dialect) => {
            it(`should identify for ${dialect}`, () => {
              const actual = identify(query, { dialect });
              const expected = [
                {
                  start: 0,
                  end:  42 + temp.length,
                  text: query,
                  type: 'CREATE_VIEW',
                  executionType: 'MODIFICATION',
                },
              ];

              expect(actual).to.eql(expected);
            });
          });

          (['generic', 'mysql', 'mssql'] as Dialect[]).forEach((dialect) => {
            it(`should throw error for ${dialect}`, () => {
              const regex = new RegExp(`Expected any of these tokens .* instead of type="unknown" value="${temp}" \\(currentStep=1\\)`);
              expect(() => identify(query, { dialect })).to.throw(regex);
            });
          });
        });
      });

      describe('identify "CREATE VIEW" with algorithm for mysql', () => {
        ['UNDEFINED', 'MERGE', 'TEMPTABLE'].forEach((algo) => {
          it(`should identify "CREATE ALGORITHM = ${algo}"`, () => {
            const query = `CREATE ALGORITHM = ${algo} VIEW vista AS SELECT 'Hello World';`;
            const actual = identify(query, { dialect: 'mysql' });
            const expected = [
              {
                start: 0,
                end: 54 + algo.length,
                text: query,
                type: 'CREATE_VIEW',
                executionType: 'MODIFICATION',
              },
            ];

            expect(actual).to.eql(expected);
          });
        });
      });

      describe('identify "CREATE VIEW" with SQL SECURITY for mysql', () => {
        ['DEFINER', 'INVOKER'].forEach((type) => {
          it(`should identify "SQL SECURITY ${type}"`, () => {
            const query = `CREATE SQL SECURITY ${type} VIEW vista AS SELECT 'Hello World';`;
            const actual = identify(query, { dialect: 'mysql' });
            const expected = [
              {
                start: 0,
                end: 55 + type.length,
                text: query,
                type: 'CREATE_VIEW',
                executionType: 'MODIFICATION',
              },
            ];

            expect(actual).to.eql(expected);
          });
        });
      })
    });

    it('should identify sqlite "CREATE TRIGGER" statement', function () {
      const actual = identify('CREATE TRIGGER sqlmods AFTER UPDATE ON bar FOR EACH ROW WHEN old.yay IS NULL BEGIN UPDATE bar SET yay = 1 WHERE rowid = NEW.rowid; END;', { dialect: 'sqlite' });
      const expected = [
        {
          start: 0,
          end: 134,
          text: 'CREATE TRIGGER sqlmods AFTER UPDATE ON bar FOR EACH ROW WHEN old.yay IS NULL BEGIN UPDATE bar SET yay = 1 WHERE rowid = NEW.rowid; END;',
          type: 'CREATE_TRIGGER',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify sqlite "CREATE TRIGGER" statement with case', function () {
      const sql = `CREATE TRIGGER DeleteProduct
      BEFORE DELETE ON Product
      BEGIN
          SELECT CASE WHEN (SELECT Inventory.InventoryID FROM Inventory WHERE Inventory.ProductID = OLD.ProductID and Inventory.Quantity=0) IS NULL
          THEN RAISE(ABORT,'Error code 82')
          END;
          -- If RAISE was called, next isntructions are not executed.
          DELETE from inventory where inventory.ProductID=OLD.ProductID;
      END;`;

      const actual = identify(sql);
      const expected = [
        {
          start: 0,
          end: 431,
          text: sql,
          type: 'CREATE_TRIGGER',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify SQLSERVER "CREATE TRIGGER" statement', function () {
      const query = `CREATE TRIGGER Purchasing.LowCredit ON Purchasing.PurchaseOrderHeader
        AFTER INSERT
        AS
        IF (ROWCOUNT_BIG() = 0)
        RETURN;
        IF EXISTS (SELECT *
                  FROM Purchasing.PurchaseOrderHeader AS p
                  JOIN inserted AS i
                  ON p.PurchaseOrderID = i.PurchaseOrderID
                  JOIN Purchasing.Vendor AS v
                  ON v.BusinessEntityID = p.VendorID
                  WHERE v.CreditRating = 5
                  )
        BEGIN
        RAISERROR ('A vendor''s credit rating is too low to accept new
        purchase orders.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN
        END;`;
      const actual = identify(query, { dialect: 'mssql' });
      const expected = [
        {
          start: 0,
          end: 671,
          text: query,
          type: 'CREATE_TRIGGER',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify postgres "CREATE TRIGGER" statement', function () {
      const actual = identify('CREATE TRIGGER view_insert INSTEAD OF INSERT ON my_view FOR EACH ROW EXECUTE PROCEDURE view_insert_row();');
      const expected = [
        {
          start: 0,
          end: 104,
          text: 'CREATE TRIGGER view_insert INSTEAD OF INSERT ON my_view FOR EACH ROW EXECUTE PROCEDURE view_insert_row();',
          type: 'CREATE_TRIGGER',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify postgres "CREATE FUNCTION" statement with LANGUAGE at end', function () {
      const sql = `CREATE FUNCTION quarterly_summary_func(start_date date DEFAULT CURRENT_TIMESTAMP)
      RETURNS TABLE (staff_name text, staff_bonus int, quarter tsrange)
      As $$
      DECLARE
        employee RECORD;
        total_bonus int;
        sales_total int;
        end_date date := start_date + interval '3 months';
      BEGIN
        FOR employee IN SELECT staff_id FROM staff LOOP
          EXECUTE 'SELECT sum(staff_bonus), sum(sales_price) FROM sales WHERE staff_id = $1
          AND created_at >= $2 AND created_at < $3'
             INTO total_bonus, sales_total
             USING employee.staff_id, start_date, end_date;
          RAISE NOTICE 'total bonus is % and total sales is %', total_bonus, sales_total;
         EXECUTE 'INSERT INTO sales_summary (staff_id, bonus, total_sales, period) VALUES
                    ($1, $2, $3, tsrange($4, $5))'
             USING employee.staff_id, total_bonus, sales_total, start_date, end_date;
        END LOOP;
        DELETE FROM sales WHERE created_at >= start_date
               AND created_at < end_date;
        RETURN QUERY SELECT name, bonus, period FROM sales_summary
                     LEFT JOIN staff on sales_summary.staff_id = staff.staff_id;
       RETURN;
      END;
      $$
      LANGUAGE plpgsql;`;
      const actual = identify(sql, { dialect: 'psql' });
      const expected = [
        {
          start: 0,
          end: 1268,
          text: sql,
          type: 'CREATE_FUNCTION',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify postgres "CREATE FUNCTION" statement with LANGUAGE at beginning', function () {
      const sql = `CREATE OR REPLACE FUNCTION f_grp_prod(text)
      RETURNS TABLE (
        name text
      , result1 double precision
      , result2 double precision)
    LANGUAGE plpgsql STABLE
    AS
    $BODY$
    DECLARE
        r      mytable%ROWTYPE;
        _round integer;
    BEGIN
        -- init vars
        name    := $1;
        result2 := 1;       -- abuse result2 as temp var for convenience

    FOR r IN
        SELECT *
        FROM   mytable m
        WHERE  m.name = name
        ORDER  BY m.round
    LOOP
        IF r.round <> _round THEN   -- save result1 before 2nd round
            result1 := result2;
            result2 := 1;
        END IF;

        result2 := result2 * (1 - r.val/100);
        _round  := r.round;
    END LOOP;

    RETURN NEXT;

    END;
    $BODY$;`;
      const actual = identify(sql, { dialect: 'psql' });
      const expected = [
        {
          start: 0,
          end: 782,
          text: sql,
          type: 'CREATE_FUNCTION',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify postgres "CREATE FUNCTION" statement with case', function () {
      const sql = `CREATE OR REPLACE FUNCTION af_calculate_range(tt TEXT, tc INTEGER)
      RETURNS INTEGER IMMUTABLE AS $$
      BEGIN
          RETURN CASE tt WHEN 'day' THEN tc * 60 * 60
                         WHEN 'hour' THEN tc * 60
                 END;
      END;
      $$
      LANGUAGE PLPGSQL;`;
      const actual = identify(sql, { dialect: 'psql' });
      const expected = [
        {
          start: 0,
          end: 285,
          text: sql,
          type: 'CREATE_FUNCTION',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify mysql "CREATE FUNCTION" statement', function () {
      const actual = identify("CREATE FUNCTION hello (s CHAR(20)) RETURNS CHAR(50) DETERMINISTIC RETURN CONCAT('Hello, ',s,'!');");
      const expected = [
        {
          start: 0,
          end: 96,
          text: "CREATE FUNCTION hello (s CHAR(20)) RETURNS CHAR(50) DETERMINISTIC RETURN CONCAT('Hello, ',s,'!');",
          type: 'CREATE_FUNCTION',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify mysql "CREATE FUNCTION" statement with definer', function () {
      const actual = identify("CREATE DEFINER = 'admin'@'localhost' FUNCTION hello (s CHAR(20)) RETURNS CHAR(50) DETERMINISTIC RETURN CONCAT('Hello, ',s,'!');", { dialect: 'mysql' });
      const expected = [
        {
          start: 0,
          end: 126,
          text: "CREATE DEFINER = 'admin'@'localhost' FUNCTION hello (s CHAR(20)) RETURNS CHAR(50) DETERMINISTIC RETURN CONCAT('Hello, ',s,'!');",
          type: 'CREATE_FUNCTION',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify sql server "CREATE FUNCTION" statement', function () {
      const query = `CREATE FUNCTION dbo.ISOweek (@DATE datetime)
      RETURNS int
      WITH EXECUTE AS CALLER
      AS
      BEGIN
          DECLARE @ISOweek int;
          SET @ISOweek= DATEPART(wk,@DATE)+1
              -DATEPART(wk,CAST(DATEPART(yy,@DATE) as CHAR(4))+'0104');
      --Special cases: Jan 1-3 may belong to the previous year
          IF (@ISOweek=0)
              SET @ISOweek=dbo.ISOweek(CAST(DATEPART(yy,@DATE)-1
                  AS CHAR(4))+'12'+ CAST(24+DATEPART(DAY,@DATE) AS CHAR(2)))+1;
      --Special case: Dec 29-31 may belong to the next year
          IF ((DATEPART(mm,@DATE)=12) AND
              ((DATEPART(dd,@DATE)-DATEPART(dw,@DATE))>= 28))
          SET @ISOweek=1;
          RETURN(@ISOweek);
      END;`;
      const actual = identify(query, { dialect: 'mssql' });
      const expected = [
        {
          start: 0,
          end: 723,
          text: query,
          type: 'CREATE_FUNCTION',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify "CREATE DATABASE" statement', function () {
      const actual = identify('CREATE DATABASE Profile;');
      const expected = [
        {
          start: 0,
          end: 23,
          text: 'CREATE DATABASE Profile;',
          type: 'CREATE_DATABASE',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "DROP TABLE" statement', function () {
      const actual = identify('DROP TABLE Persons;');
      const expected = [
        {
          start: 0,
          end: 18,
          text: 'DROP TABLE Persons;',
          type: 'DROP_TABLE',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "DROP VIEW" statement', () => {
      const actual = identify('DROP VIEW kinds;');
      const expected = [
        {
          start: 0,
          end: 15,
          text: 'DROP VIEW kinds;',
          type: 'DROP_VIEW',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "DROP DATABASE" statement', function () {
      const actual = identify('DROP DATABASE Profile;');
      const expected = [
        {
          start: 0,
          end: 21,
          text: 'DROP DATABASE Profile;',
          type: 'DROP_DATABASE',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "DROP TRIGGER" statement', function () {
      const actual = identify('DROP TRIGGER delete_stu on student_mast;');
      const expected = [
        {
          start: 0,
          end: 39,
          text: 'DROP TRIGGER delete_stu on student_mast;',
          type: 'DROP_TRIGGER',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify "DROP FUNCTION" statement', function () {
      const sql = 'DROP FUNCTION sqrt(integer);';
      const actual = identify(sql);
      const expected = [
        {
          start: 0,
          end: 27,
          text: sql,
          type: 'DROP_FUNCTION',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify "TRUNCATE TABLE" statement', function () {
      const actual = identify('TRUNCATE TABLE Persons;');
      const expected = [
        {
          start: 0,
          end: 22,
          text: 'TRUNCATE TABLE Persons;',
          type: 'TRUNCATE',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "INSERT" statement', function () {
      const actual = identify('INSERT INTO Persons (PersonID, Name) VALUES (1, \'Jack\');');
      const expected = [
        {
          start: 0,
          end: 55,
          text: 'INSERT INTO Persons (PersonID, Name) VALUES (1, \'Jack\');',
          type: 'INSERT',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify "UPDATE" statement', function () {
      const actual = identify('UPDATE Persons SET Name = \'John\' WHERE PersonID = 1;');
      const expected = [
        {
          start: 0,
          end: 51,
          text: 'UPDATE Persons SET Name = \'John\' WHERE PersonID = 1;',
          type: 'UPDATE',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify more complex "UPDATE" statement with a weird string/keyword', function () {
      const actual = identify('UPDATE customers SET a = 0, note = CONCAT(note, "abc;def") WHERE a = 10;');
      const expected = [
        {
          start: 0,
          end: 71,
          text: 'UPDATE customers SET a = 0, note = CONCAT(note, "abc;def") WHERE a = 10;',
          type: 'UPDATE',
          executionType: 'MODIFICATION',
        },
      ];
      expect(actual).to.eql(expected);
    });

    it('should identify "DELETE" statement', function () {
      const actual = identify('DELETE FROM Persons WHERE PersonID = 1;');
      const expected = [
        {
          start: 0,
          end: 38,
          text: 'DELETE FROM Persons WHERE PersonID = 1;',
          type: 'DELETE',
          executionType: 'MODIFICATION',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement starting with inline comment', function () {
      const actual = identify(`
        -- some comment
        SELECT * FROM Persons
      `);
      const expected = [
        {
          start: 33,
          end: 60,
          text: 'SELECT * FROM Persons\n      ',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement starting with block comment', function () {
      const actual = identify(`
        /**
          * some comment
          */
        SELECT * FROM Persons
      `);
      const expected = [
        {
          start: 59,
          end: 86,
          text: 'SELECT * FROM Persons\n      ',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement ending with block comment', function () {
      const actual = identify(`
        SELECT * FROM Persons
        /**
          * some comment
          */
      `);
      const expected = [
        {
          start: 9,
          end: 86,
          text: 'SELECT * FROM Persons\n        /**\n          * some comment\n          */\n      ',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement ending with inline comment', function () {
      const actual = identify(`
        SELECT * FROM Persons
        -- some comment
      `);
      const expected = [
        {
          start: 9,
          end: 60,
          text: 'SELECT * FROM Persons\n        -- some comment\n      ',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement with inline comment in the middle', function () {
      const actual = identify(`
        SELECT *
        -- some comment
        FROM Persons
      `);
      const expected = [
        {
          start: 9,
          end: 68,
          text: 'SELECT *\n        -- some comment\n        FROM Persons\n      ',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement with block comment in the middle', function () {
      const actual = identify(`
        SELECT *
        /**
          * some comment
          */
        FROM Persons
      `);
      const expected = [
        {
          start: 9,
          end: 94,
          text: 'SELECT *\n        /**\n          * some comment\n          */\n        FROM Persons\n      ',
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify empty statement', function () {
      const actual = identify('');
      const expected = [];

      expect(actual).to.eql(expected);
    });

    it('should able to detect a statement even without knowing its type when strict is disabled - CREATE INDEX', function () {
      const actual = identify('CREATE INDEX i1 ON t1 (col1);', { strict: false });
      const expected = [
        {
          start: 0,
          end: 28,
          text: 'CREATE INDEX i1 ON t1 (col1);',
          type: 'CREATE_INDEX',
          executionType: 'UNKNOWN',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement using CTE with column list', () => {
      const sql = `WITH cte_name (column1, column2) AS (
        SELECT * FROM table
      )
      SELECT * FROM cte_name;`;

      const actual = identify(sql);
      const expected = [
        {
          start: 0,
          end: 102,
          text: sql,
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    });

    it('should identify statement using multiple CTE and no column list', () => {
      const sql = `WITH
      cte1 AS
      (
        SELECT 1 AS id
      ),
      cte2 AS
      (
        SELECT 2 AS id
      ),
      cte3 AS
      (
        SELECT 3 as id
      )
      SELECT  *
      FROM    cte1
      UNION ALL
      SELECT  *
      FROM    cte2
      UNION ALL
      SELECT  *
      FROM    cte3`;

      const actual = identify(sql);
      const expected = [
        {
          start: 0,
          end: 301,
          text: sql,
          type: 'SELECT',
          executionType: 'LISTING',
        },
      ];

      expect(actual).to.eql(expected);
    })
  });
});
